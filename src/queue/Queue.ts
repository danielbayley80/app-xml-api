import Redis, { RedisOptions } from 'ioredis';
import { ProcessOptions } from '../spider/SpiderProcess';
import crypto from "crypto"
import { UriStatus } from 'src/page-request/PageTypes';

declare global {
      interface GlobalSettings {
            redisUrl?: string;
      }
}

export class NextItem {
      batchId: string = "";
      processed: number = 0;
      url: string = "";   // the url for the next job

}

export class QueueStatus {
      //  batchId: string = "";
      processed: number = 0;
      threads: number = 0;
      todo: number = 0;
      cancelled: boolean = false;
}

export function createHash(url: string): string {
      const hash = crypto.createHash('sha1').update(url.toLowerCase()).digest('hex').substring(0, 12)
      if (!hash) return "err"
      return hash
}

export interface iQueueManager {
      clearAll(): Promise<void>;
      clear(batchId: string): Promise<void>;
      addSettings(batchId: string, settings: ProcessOptions): Promise<void>;
      getSettings(batchId: string): Promise<ProcessOptions | undefined>;
      getQueueStats(batchId: string): Promise<QueueStatus>;
      getNextTask(batchId: string, maxThreads : number): Promise<Task | undefined>;
      threadEnded(batchId: string): Promise<number | undefined>;
      queueItems(batchId: string, tasks: Task[]): Promise<void>;
      checkIgnoreList(batchId: string, values: string[]): Promise<string[]>
      close(): Promise<void>;
}

export interface Task {
      url: string;
      status: UriStatus;
      redirects: number;
}

export class QueueManager implements iQueueManager {
      private redisClient: Redis | undefined;

      public static inject = ['settings'] as const;
      constructor(private settings: GlobalSettings) {
            this.initialize();
      }

      isConnecting = false;

      initialize() {

            if (this.isConnecting) {
                  console.log("Redis is connecting ....")
                  return;
            }

            this.isConnecting = true;

            if (!this.settings.redisUrl) throw new Error("redis URL is not defined")
            this.redisClient = new Redis(this.settings.redisUrl)

            this.redisClient.on('connect', (...args: any[]) => this.handleStatusChange('connect', ...args));
            this.redisClient.on('ready', (...args: any[]) => this.handleStatusChange('ready', ...args));
            this.redisClient.on('error', (...args: any[]) => this.handleStatusChange('error', ...args));
            this.redisClient.on('close', (...args: any[]) => this.handleStatusChange('close', ...args));

            console.log("Waiting for Redis to connect");

      }


      handleStatusChange(event: string, ...args: any[]) {
            if (event == "connecting" || event == "reconnecting" || event == "ready") { this.isConnecting = true }
            else { this.isConnecting = false };

            switch (event) {
                  case 'connect':
                        console.log('Connected to Redis');
                        break;
                  case 'ready':
                        console.log('Redis client is ready to send commands');
                        break;
                  case 'error':
                        console.error('Redis error:', args[0]);
                        break;
                  case 'close':
                        console.log('Connection to Redis closed');
                        break;
                  default:
                        console.log(`Unknown event: ${event}`);
            }
      }


      async close() {

            await new Promise<void>((resolve) => {
                  if (!this.redisClient) { return; }
                  console.log("Closing redis")
                  this.redisClient.quit(() => {
                        resolve();
                  });
            });
            // redis.quit() creates a thread to close the connection.
            // We wait until all threads have been run once to ensure the connection closes.
            await new Promise(resolve => setImmediate(resolve));

      }

      async addSettings(batchId: string, settings: ProcessOptions): Promise<void> {

            const settingsString = JSON.stringify(settings);
            await this.redisClient?.hset(`batch:${batchId}:params`, 'settings', settingsString);
            return;
      }



      async getSettings(batchId: string): Promise<ProcessOptions | undefined> {

            const settings = await this.redisClient?.hget(`batch:${batchId}:params`, "settings");
            if (!settings) return undefined;
            return JSON.parse(settings);
      }

      async getQueueStats(batchId: string): Promise<QueueStatus> {

            const maxThreadCount: number = 5

            const luaScript = `
            local threads = tonumber(redis.call('hget', KEYS[1]..':params', 'threadCount') or 0)
            local processed = redis.call('SCARD', KEYS[1]..':processed')
            local todo = redis.call('llen', KEYS[1]..':todo')
            local cancelled =  tonumber(redis.call('hget', KEYS[1]..':params', 'cancelled') or 0)
            local pending =  tonumber(redis.call('hget', KEYS[1]..':params', 'threadsPending') or 0)
            return { threads, processed, todo, cancelled}
            `;

            const key = `batch:${batchId}`;

            const result = await this.redisClient?.eval(luaScript, 1, key) as [number, number, number, boolean];

            const [threads, processed, todo, cancelled] = result;



            return { cancelled: Boolean(cancelled), todo, threads, processed };
      }



      async getNextTask(batchId: string, maxthreads : number): Promise<Task | undefined> {
            const luaScript = `
            local maxThreads = tonumber(ARGV[1])
            local threads = tonumber(redis.call('hget', KEYS[1]..':params', 'threadCount') or 0)

            if threads >= maxThreads then
                  return nil;
            end

            local item = redis.call('lpop', KEYS[1]..':todo')
            if item then
                  redis.call('HINCRBY', KEYS[1]..':params', 'threadCount', 1)
            end 
            return item
            `;

            const key = `batch:${batchId}`;

            const result = await this.redisClient?.eval(luaScript, 1, key, maxthreads);


            if (!result) return;

            return JSON.parse(result as string) as Task


      }

      async registerPending(batchId: string,threads:number): Promise<void> {

            const luaScript = `
     
                  redis.call('HINCRBY', KEYS[1]..':params', 'threadsPending', -1)
 
            `;

            const key = `batch:${batchId}`;

            const result = await this.redisClient?.eval(luaScript, 1, key);



      }

      async threadEnded(batchId: string): Promise<number | undefined> {

            // Decrement the thread counter
            const result = await this.redisClient?.hincrby(`batch:${batchId}:params`, 'threadCount', -1);
            return result
      }

      async queueItems(batchId: string, tasks: Task[]): Promise<void> {
            const hashes: string[] = tasks.map(task => createHash(task.url));

            const luaScript = `
                local todoKey = KEYS[1]
                local processedKey = KEYS[2]
                local urls = cjson.decode(ARGV[1])
                local hashes = cjson.decode(ARGV[2])
        
                for i, url in ipairs(urls) do
                    local hash = hashes[i] -- Get the corresponding hash
                    local exists = redis.call('SISMEMBER', processedKey, hash)
                    if exists == 0 then
                        redis.call('SADD', processedKey, hash, '1')
                        redis.call('LPUSH', todoKey, cjson.encode(url))
                    end
                end
            `;

            const args = [JSON.stringify(tasks), JSON.stringify(hashes)];
            await this.redisClient?.eval(luaScript, 2, `batch:${batchId}:todo`, `batch:${batchId}:processed`, ...args);

      }

      async checkIgnoreList(batchId: string, values: string[]): Promise<string[]> {
            const luaScript = `
                local ignoredKey = KEYS[1]
                local values = cjson.decode(ARGV[1])
                local nonExistingValues = {}
        
                for _, value in ipairs(values) do
                    local exists = redis.call('SISMEMBER', ignoredKey, value)
                    if exists == 0 then
                        redis.call('SADD', ignoredKey, value)
                        table.insert(nonExistingValues, value)
                    end
                end
        
                   if #nonExistingValues == 0 then
                        return nil
                  else
                        return cjson.encode(nonExistingValues)
                  end
            `;

            const ignoredKey = `batch:${batchId}:ignored`;
            const args = [JSON.stringify(values)];

            const nonExistingValuesString = await this.redisClient?.eval(luaScript, 1, ignoredKey, ...args) as string;
            const nonExistingValues: string[] = JSON.parse(nonExistingValuesString);

            return nonExistingValues;
      }


      async clearAll(): Promise<void> {
            throw new Error('Method not implemented.');
      }

      async clear(batchId: string): Promise<void> {
            const luaScript = `
                local todoKey = KEYS[1]
                local processedKey = KEYS[2]
                local paramsKey = KEYS[3]
                local ignoreKey = KEYS[4]
        
                redis.call('DEL', todoKey)  -- Delete the todo list
                redis.call('DEL', processedKey)  -- Delete the processed items hash
                redis.call('DEL', paramsKey)  -- Delete the params hashtable
                redis.call('DEL', ignoreKey)  -- Delete the params hashtable
            `;

            await this.redisClient?.eval(luaScript, 4, `batch:${batchId}:todo`, `batch:${batchId}:processed`, `batch:${batchId}:params`, `batch:${batchId}:ignored`);

      }

}
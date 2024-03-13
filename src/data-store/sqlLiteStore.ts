



import Database from 'better-sqlite3';
import { Pool } from 'better-sqlite-pool';
import { DataFilter, DataValue } from './DataService';


declare global {
      interface GlobalSettings {
            sqliteFolder?: string;
      }
}

export interface iDataStore {
      initialize(batchId: string): void
      writeData(batchId: string, data: DataValue[]): void
      getAll(batchId: string): DataValue[]
      get(batchId: string, id: string): DataValue | undefined;
      clear(batchId: string): void
}



export class SqlLiteDataStore implements iDataStore {


      public static inject = ['settings'] as const;
      constructor(private settings: GlobalSettings) {
            setInterval(() => {
                  this.cleanupOldPools();
            }, this.poolCleanupInterval);

      }

      private poolMap: { [filename: string]: { lastUsed: number; pool: Pool } } = {};
      private poolCleanupInterval: number = 60 * 60 * 1000; // 60 minutes in milliseconds


      private cleanupOldPools() {
            const currentTime = Date.now();
            Object.keys(this.poolMap).forEach(filename => {
                  const { lastUsed, pool } = this.poolMap[filename];
                  if (currentTime - lastUsed >= this.poolCleanupInterval) {
                        pool.close();  // Clear the pool
                        delete this.poolMap[filename]; // Remove the entry from poolMap
                  }
            });
      }

      private getDb(batchId: string): Database.Database {
            const filename = `${this.settings.sqliteFolder}/${batchId}.db`;
            try {
                  const db = new Database(filename)
                  db.pragma('journal_mode = WAL');
                  return db;
            } catch (error) {
                  throw error
            }

      }

      initialize(batchId: string): void {

            const db = this.getDb(batchId);

            try {
                  // Create the 'data' table if it doesn't exist
                  db.exec(`
                    CREATE TABLE IF NOT EXISTS urls (
                        id VARCHAR(12) PRIMARY KEY,
                        url  VARCHAR(256),
                        title  VARCHAR(256),
                        spiderStatus VARCHAR(12),
                        requestStatus VARCHAR(12),
                        requestCode INTEGER
                    ); DELETE FROM urls; `);

                  db.exec(`
                CREATE TABLE IF NOT EXISTS data (
                    id VARCHAR(12) PRIMARY KEY,
                    data TEXT
                );  DELETE FROM data `);

                  db.exec(`
                CREATE TABLE IF NOT EXISTS content (
                    id VARCHAR(12) PRIMARY KEY,
                    content TEXT
                ); DELETE FROM content `);


            } catch (error) {
                  throw error
            } finally {
                  // Close the database connection
                  db.close();
            }
      }

      writeData(batchId: string, data: DataValue[]): void {
            const db = this.getDb(batchId)

            try {
                  const stmtUrls = db.prepare("INSERT INTO urls (id, url, spiderStatus, requestStatus, requestCode, title) VALUES (?, ?, ?, ?, ?, ?)");
                  const stmtData = db.prepare("INSERT INTO data (id, data) VALUES (?, ?)");
                  // Begin transaction
                  const transaction = db.transaction((data: DataValue[]) => {
                        for (const item of data) {
                              stmtUrls.run([item.id, item.url, item.spiderStatus, item.requestStatus, item.requestCode, item.title])
                              if (item.data && item.data.length > 0) stmtData.run([item.id, item.data]);
                        }


                  });
                  transaction(data);
            } catch (error) {
                  throw error
            }
            finally {
                  db.close();
            }


      }

      addParamValue(value: string, field: string, where: string[], params: any[]) {
            if (value.length > 0) {
                  where.push(` ${field} LIKE ? `);
                  params.push(value)
            }
      }

      addParamArray(values: string[], field: string, where: string[], params: any[]) {
            if (values.length > 0) {
                  const qMarks = Array.from({ length: values.length }, () => "?").join(", ")
                  where.push(` ${field} IN ( ${qMarks} ) `);
                  params.push(...values)
            }
      }

      search(batchId: string, filter: DataFilter)  : DataValue[] {

            const start = filter.pageSize * (filter.page - 1)
            const end = (filter.pageSize * filter.page) - 1

            let cmd = `SELECT * FROM urls `

            if (filter.includeContent) cmd += ` LEFT JOIN content ON urls.id = content.id `
            if (filter.includeContent) cmd += ` LEFT JOIN data ON urls.id = data.id `

            let where: string[] = [];
            let params: any[] = []


            this.addParamValue(filter.url, "url", where, params);
            this.addParamValue(filter.title, "title", where, params);
            this.addParamArray(filter.spiderStatus, "spiderStatus", where, params);
            this.addParamArray(filter.requestStatus, "requestStatus", where, params);

            if (where.length > 0) {   cmd += " WHERE " + where.join(" AND ") }

            cmd += " LIMIT ? OFFSET ?; "
            params.push(start);
            params.push(end);

            const db = this.getDb(batchId)

            try {
                  const stmt = db.prepare(cmd);
                  const rows = stmt.all(params);

                  if (!rows) return [];

                  return rows as DataValue[]

            } catch (error) {
                  throw error
            }
            finally {
                  db.close();
            }

      }

      get(batchId: string, id: string): DataValue | undefined {
            const db = this.getDb(batchId)

            try {
                  const stmt = db.prepare("SELECT * FROM data WHERE id = ?");


                  const row = stmt.get(id) as any; // Execute the prepared statement
                  if (!row) return undefined;
                  const data = JSON.parse(row.data);
                  return data

            } catch (error) {
                  throw error
            }
            finally {
                  db.close();
            }
            return undefined;

      }

      getAll(batchId: string): DataValue[] {
            const db = this.getDb(batchId);
            try {
                  const stmt = db.prepare("SELECT * FROM data WHERE batchId = ?");
                  const rows = stmt.all(batchId) as any[]; // Execute the prepared statement
                  const results: DataValue[] = []
                  for (const row of rows) {
                        const result = JSON.parse(row.data)
                        results.push(result);
                  }
                  return results;
            } catch (error) {
                  throw error;
            } finally {
                  db.close();
            }
      }

      clear(batchId: string): void {
            const db = this.getDb(batchId)

            try {
                  const stmt = db.prepare("DELETE FROM data");
                  stmt.run() as any; // Execute the prepared statement
            } catch (error) {
                  throw error
            }
            finally {
                  db.close();
            }
            return undefined;

      }

}
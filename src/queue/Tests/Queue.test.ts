import { ProcessOptions } from "../../spider/SpiderProcess";
import { Task, iQueueManager } from "../Queue";
import { InjectorService } from "./../../common/injector";


describe('QueueManager', () => {
    let queueManager: iQueueManager;
    
    const batchId = "99999999-0dd5-40c1-9970-0a707e999999" //getTestGuid(); // Generate batch ID


    beforeAll(  async () =>{
      queueManager = InjectorService.getTestInjector().resolve("queueManager");
    })

    afterAll(async () => {
      await queueManager.close();
    });


    afterEach(async () => {
   //   await queueManager.close();
    
    });
 
    beforeEach(() => {
        // Initialize your queue manager implementation here
        // queueManager = new YourQueueManagerImplementation();
    });

    it('should add and retrieve settings correctly', async () => {

        const settings: ProcessOptions = new ProcessOptions();
      

        await queueManager.addSettings(batchId, settings);

        const retrievedSettings = await queueManager.getSettings(batchId);
        expect(retrievedSettings).toEqual(settings);
        

    });

    it('should return undefined for non-existent settings', async () => {
        const batchId = 'nonExistentBatch';

        const retrievedSettings = await queueManager.getSettings(batchId);
        expect(retrievedSettings).toBeUndefined();
    });

    it('should return queue stats correctly', async () => {

        await  queueManager.clear(batchId);
        
        const tasks : Task[]= [{url:"1", status:"http", redirects:0},  {url:"2", status:"http",redirects:0},  {url:"3", status:"http",redirects:0},  {url:"4", status:"http",redirects:0} ]

        await queueManager.queueItems(batchId,tasks)

        const queueData = await queueManager.getQueueStats(batchId);
        // Assert on queueData
        expect( queueData.todo).toBe(4);
        expect( queueData.processed).toBe(4);
        expect( queueData.threads).toBe(0);
    });

    it('should decrement thread', async () => {



      await  queueManager.clear(batchId);

      const tasks : Task[]= [{url:"1", status:"http",redirects:0},  {url:"2", status:"http",redirects:0},  {url:"3", status:"http",redirects:0},  {url:"4", status:"http",redirects:0} ]

      await queueManager.queueItems(batchId, tasks)   ;
      const task = await queueManager.getNextTask(batchId, 1);

      const queueData = await queueManager.getQueueStats(batchId);

  
      // Assert on queueData
      expect(queueData.todo).toBe(3);
      expect(task?.url).toBe("1");
      
   
    });


    it('should check and exclude', async () => {



      await  queueManager.clear(batchId);

      const array1 = ["1", "2", "3", "4", "5"]
      const array2 = [ "2", "3", "7", "5", "8"]

  
      const results1 =await queueManager.checkIgnoreList(batchId,array1);
      const results2 =await queueManager.checkIgnoreList(batchId,array2);
 

  console.log(results2)
      // Assert on queueData
      expect(results1).toEqual(["1", "2", "3", "4", "5"]);
      expect(results2).toEqual(["7", "8"]);
      
   
    });



    it('should queue  lots of items correctly', async () => {
    
      const passes = 1000;  
      const batchSize = 25;


      await  queueManager.clear(batchId);

      for (let i = 0; i < passes; i++) {
        const files = Array.from({ length: batchSize }, (_, index) => ({url:`http://xmlsitemapgenerator.org/en/some_url/another_path/even_longer_url/that_could_cause_some_issues/test_file-${i}-${index}.html`, status:"notset"} as Task));
    
        await queueManager.queueItems(batchId, files);

      }

      const queueData = await queueManager.getQueueStats(batchId);
      // Assert on queueData
      expect( queueData.todo).toBe(passes * batchSize);
      expect( queueData.processed).toBe(passes * batchSize);
      expect( queueData.threads).toBe(0);
      


    }, 90000);


    it('should clear batch', async () => {

      await queueManager.clear(batchId);

      const tasks : Task[]= [{url:"1", status:"http",redirects:0},  {url:"2", status:"http",redirects:0},  {url:"3", status:"http",redirects:0},  {url:"4", status:"http",redirects:0},  {url:"5", status:"http",redirects:0} ]

      await queueManager.queueItems(batchId,tasks)   ;

      let  queueData = await queueManager.getQueueStats(batchId);
      // Assert on queueData
      expect( queueData.todo).toBe(5);
      expect( queueData.processed).toBe(5);

      await queueManager.clear(batchId);
  queueData = await queueManager.getQueueStats(batchId);
  
      expect( queueData.todo).toBe(0);
      expect( queueData.processed).toBe(0);

    

      // Implement logic to assert on the queued items
  });



    // Add more test cases as needed for other methods
});

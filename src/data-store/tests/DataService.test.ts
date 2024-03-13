import { DataValue, iDataService } from '../DataService';
import { InjectorService } from '../../common/injector';



describe('DataService', () => {
      let dataService: iDataService;
      dataService = InjectorService.getTestInjector().resolve("dataService");
      let id: string;
      let file: string;

      const batchId = "99999999-0dd5-40c1-9970-0a707e999999" //getTestGuid(); // Generate batch ID

      beforeEach(() => {

      });

      it('initialize() should initialize data service', async () => {

            await expect(dataService.initialize(batchId)).resolves.not.toThrow();

      });

      it('writeData() should write data', async () => {

            id = getTestGuid();
            file = getData(5);

            const data :DataValue[] = [{ id, url:"", spiderStatus:"notset", requestCode:0, requestStatus:"notset",title:"test", data: file }];
            await expect(dataService.writeData(batchId, data)).resolves.toBe(true);
            // Add more assertions if necessary
      });

      it('get() should retrieve the correct file', async () => {

            id = getTestGuid();
            file = getData(5);

            const data :DataValue[] = [{ id, url:"", spiderStatus:"notset", requestCode:0, requestStatus:"notset",title:"test", data: file }];
            dataService.writeData(batchId, data)
            const retrievedFile = await dataService.get(batchId, id);
            // Assert that the retrieved file matches the expected file
            expect(retrievedFile).toEqual({ id, data: file });
      });

      it('get() should return undefined if file not found', async () => {
            const fileId = 'nonexistent_file'; // Non-existent file ID
            const retrievedFile = await dataService.get(batchId, fileId);
            // Assert that the retrieved file is undefined
            expect(retrievedFile).toBeUndefined();
      });

      it('writeData() should write data', async () => {

            const file = getData(5);
            const data :DataValue[] = [{ id, url:"", spiderStatus:"notset", requestCode:0, requestStatus:"notset",title:"test", data: file }];

            await expect(dataService.writeData(batchId, data)).resolves.toBe(true);
            // Add more assertions if necessary
      });


      test('writeData() should write lots of data', async () => {

            const records = 500;
            const datasize = 100; // kb
 
            const batchPromises: Promise<boolean>[] = [];

            for (let i = 0; i < records; i++) {
                  console.log(`Write data ${i}`)
                  const data = generateTestData(datasize); // Generate test data for the batch
                   dataService.writeData(batchId, data);
                  await new Promise(resolve => setImmediate(resolve));
            }
 
            const results = await Promise.all(batchPromises);

            results.forEach(result => {
                expect(result).toBe(true);
            });

            
      }, 600000);



      // Function to generate test data (replace with your own implementation)
      function generateTestData(size: number): DataValue[] {
            const files = Array.from({ length: 1 }, (_, index) => ({
                  id: getTestGuid(), // Generate file ID
                  data: getData(size), // Generate file data (5 KB)
                  url:"", spiderStatus:"notset", requestCode:0, requestStatus:"notset"
            } as DataValue));
            return files;
      }
 
// Function to generate a new batch ID with first block as 9's
function getTestGuid(): string {
      // Generate a random GUID
      const guid = '99999999-xxxx-4xxx-yxxx-xxxxxx999999'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                  v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
      });
      return guid;
}

function getData(fileSizeK: number): string {
      const fileSizeBytes = fileSizeK * 1024; // Convert kilobytes to bytes
      const chunk = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '; // Sample chunk of text
      const chunksNeeded = Math.ceil(fileSizeBytes / chunk.length);
      return chunk.repeat(chunksNeeded).slice(0, fileSizeBytes);
}

 
});
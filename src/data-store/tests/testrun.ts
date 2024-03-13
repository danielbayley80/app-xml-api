import { InjectorService } from "./../../common/injector";
import { DataValue, iDataService } from "../DataService";
import { RequestStatus, UriStatus } from "src/page-request/PageTypes";

 
const batchId = "TEST"

run()

async function run() {
      let dataService: iDataService;
      dataService = InjectorService.getTestInjector().resolve("dataService");

      await dataService.initialize(batchId);
      await simulateLoad(dataService, 20000,1,500)
}
 

// Function to simulate load
async function simulateLoad(dataProcessor: iDataService, numPasses: number, batchSize: number, interval: number) {
         const batchPromises: Promise<boolean>[] = [];

      for (let i = 0; i < numPasses; i++) {
            console.log(`Write data ${i}`)
            const data = generateTestData(batchSize); // Generate test data for the batch
              dataProcessor.writeData(batchId, data);

            await new Promise(resolve => setImmediate(resolve));
      }

      // Wait for all batch writes to complete
         await Promise.all(batchPromises);
}

// Function to generate test data (replace with your own implementation)
function generateTestData(batchSize: number): DataValue[] {

      const files = Array.from({ length: batchSize }, (_, index) => ({
            id: getTestGuid(), // Generate file ID
            url:"test",
            data: getData(500), // Generate file data (5 KB)
            spiderStatus:"notset" as UriStatus, requestCode:0, title:"test", requestStatus:"notset" as RequestStatus
      }));
      return files;
}

      // Function to simulate delay using a Promise
      function sleep(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
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

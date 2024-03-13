
import { Request, Response } from 'express';
import { iDataStore } from './sqlLiteStore';
import { ParsedPage, RequestStatus, UriStatus } from 'src/page-request/PageTypes';

declare global {
export interface DataValue {
      id: string ;
      url: string ;
      title:string;
      spiderStatus :  UriStatus ;
      requestStatus  :  RequestStatus ;
      requestCode: number ;
      data?: ParsedPage ;
      content?: string;
}
}

export class DataFilter {

      url: string = "";
      title : string = "";
      
      spiderStatus :  UriStatus[] = [];
      requestStatus  :  RequestStatus[] = [] ;

      includeData: boolean = false;
      includeContent: boolean = false;

      page: number = 1;
      pageSize : number = 500;
      
      
}

export interface iDataService {
      initialize(batchId: string): void;
      writeData(batchId: string, data: DataValue[]): boolean
      getAll(batchId: string): DataValue[];
      get(batchId: string,id:string): DataValue| undefined;
      clear(batchId: string): void;
}



export class DataService implements iDataService {


      public static inject = ['settings', 'dataStore'] as const;
      constructor(private settings: GlobalSettings, private dataStore: iDataStore) {


       }


      initialize(batchId: string): void {
            this.dataStore.initialize(batchId);
            this.dataStore.clear(batchId);
      }
       counter = 0;
      processed = 0;



      writeData(batchId: string, data: DataValue[]): boolean {
           // console.log(`queued  ${this.counter}`)
            try {
                  this.dataStore.writeData(batchId,data);
                //  console.log("WRITE: " + (data as any).url);
            } catch (error) {
                  console.log("Error writing data for batch %s", batchId)
                  console.log(error)
                  return false;
            }
            this.processed += 1

            return true;
      }

  
      get(batchId: string, id: string): DataValue | undefined {
            return this.dataStore.get(batchId,id)
      }

      getAll(id: string): DataValue[] {
            throw new Error("Method not implemented.");
      }

      clear(batchId: string): void {
 
           // console.log(`queued  ${this.counter}`)
            try {
                  this.dataStore.clear(batchId);
            } catch (error) {
                  console.log("Error clearning data for batch %s", batchId)
                  console.log(error)
                  return ;
            }
    
      }
} 
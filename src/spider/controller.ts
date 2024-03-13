
import { Request, Response } from 'express';

import { SpiderProcess, ProcessOptions } from './SpiderProcess';
import { iHttpClient } from '../page-request/HttpClient';
import { ElementParser } from '../page-request/ParseFunctions';

import { iDataService } from '../data-store/DataService';
import { iQueueManager } from '../queue/Queue';
import { server } from 'src/server';
import { exit } from 'process';
 

export class ProcessController {

   
      private parser: ElementParser = new ElementParser();

      public static inject = ['options', 'httpClient', 'dataService', 'queueManager'] as const;
      constructor(private settings:GlobalSettings, private httpClient: iHttpClient, private dataService: iDataService, private queue: iQueueManager, private processor:SpiderProcess) {
 
      
            this.parser = new ElementParser;

      }

      async initiate(req: Request, res: Response) {
          
            const data = req.body as ProcessOptions
     
            const batchId = data.batchId;
   
            if (data instanceof Error || data instanceof Error) return res.sendStatus(400).end();

            try {
                  // must initialise data service before starting spider.
                  this.dataService.initialize(batchId);
                  await this.processor.start(batchId, data)
            
                 return res.sendStatus(200).end();
            } catch (error) {
                  console.log("************")
                  console.log(error)
                  
                  return res.sendStatus(500).end();
            }
           
      }

      async getStats(req: Request, res: Response) {
            return res.sendStatus(200).end();
      }

      async nextTask(req: Request, res: Response) {
            const batchId = req.query.batchId?.toString() ;
            const isRoot = Boolean(req.query.isRoot ?? false)

            if (! batchId ) {
                  console.log("bad batch Id")
                  return res.sendStatus(400).end();   
            }
                                                 
            await this.processor.processItem(  batchId,   isRoot)  
            return res.sendStatus(200).end();



      }

      private getUrl(req: Request): string | Error {
            const val = req.query.url || req.body.url;
            // Regular expression for validating URLs
            const urlRegex = /^(http|https):\/\/[^ "]+$/;

            // Test the URL against the regex
            if (urlRegex.test(val)) {
                  // If the URL is valid, return the URL
                  return val;
            } else {
                  // If the URL is invalid, return an error
                  return new Error('Invalid URL');
            }
      }

      private getBatchId(req: Request): string | Error {

            const val = req.query.batchId || req.body.batchId;
            // Regular expression for validating GUIDs
            const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            // Test the GUID against the regex
            if (guidRegex.test(val)) {
                  // If the GUID is valid, return the GUID
                  return val;
            } else {
                  // If the GUID is invalid, return an error
                  return new Error('Invalid GUID');
            }
      }

      private getData(req: Request): object | Error {
            const val = req.body.data;
            // Regular expression for validating URLs

            try {
                  const data = JSON.parse(val);
                  return data;
            } catch (error) {
                  return new Error("Failed to parse JSON")
            }
      }

}


import { QueueManager, QueueStatus, Task, iQueueManager } from "../queue/Queue";
import { HttpClient, iHttpClient } from "../page-request/HttpClient";

import { ElementParser, iParser } from "../page-request/ParseFunctions";
import { PageHelpers } from "../page-request/PageHelpers";
import { SanitizeOptions, sanitizeUri, sanitizeUris } from "../page-request/sanitizer/UrlSanitiser";
import axios from "axios";
import { ParsedPage } from "../page-request/PageTypes";
import { DataValue } from "src/data-store/DataService";
import { StatsFs } from "fs";

export interface ProcessData { html: string; data: object; }


export type ProcessStatus = "notset" | "processing" | "complete" | "errored"
export type NextTaskFunction = (batchId: string, url: string) => void;
export type CompletionFunction = (batchId: string) => void;


// how do we post the start and finish url.
export class ProcessOptions {
      batchId: string = ""; // identifise this job / process
      baseUrl: string = "";
      maxThreads: number = 3;
      maxPages: number = 10000
      status: ProcessStatus = "notset";

      sanitizeOptions: SanitizeOptions = new SanitizeOptions()

}
/*
declare global {
      interface GlobalSettings {
            spiderRootUrl?: string;
      }
}
*/

export class SpiderProcess {


      parser: iParser;
      serverOrigin: string = "";
      private batchTimers: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();
      private cancelled: Map<string, boolean> = new Map<string, boolean>();

      public static inject = ['httpClient', 'dataService', 'queueManager'] as const;
      constructor(private settings: GlobalSettings, private httpClient: iHttpClient, private queue: iQueueManager) {
            if (!settings.serverUrl || settings.serverUrl.length < 7) {
                  throw ("Global Setting serviceUrl not defined")
            }
            this.serverOrigin = settings.serverUrl;
            this.parser = new ElementParser;

      }

      async start(batchId: string, options: ProcessOptions) {
            await this.queue.clear(batchId);
            await this.queue.addSettings(batchId, options);

            const url = sanitizeUri(options.baseUrl, options.baseUrl, options.sanitizeOptions);

            if (!url.url) throw new Error("Base url was not provided or was invalid")

            // post first page to the queue
            await this.queue.queueItems(options.batchId, [{ url: url.url, status: url.status ?? "notset", redirects: 0 }]);
            await this.createThreads(batchId, 1)

      }

      async processItem(batchId: string, isRoot: boolean = false): Promise<void> {

            const options = await this.queue.getSettings(batchId,);
            if (!options) throw new Error("Batch or option error")

            const task = await this.queue.getNextTask(batchId, options.maxThreads); // this 
            if (!task) { return; } // if no task is returned a thread is never started so exit.

            try {


                  const page = await this.httpClient.get(task.url, 10, 100, false);

                  if (page.status.type == "redirect" && task.redirects > 4) {
                        page.status.type = "manyRedirects";
                  };

                  await this.handleSave(options, page, task);

                  // get the latest data and tasks from the queue
                  const stats = await this.queue.getQueueStats(batchId)

                  // process the page results
                  switch (page.status.type) {
                        case "okay":
                              await this.handleOkay(options, stats, page);
                              break;
                        case "redirect":
                              await this.handleRedirect(options, page, task.redirects, isRoot);
                              break;
                        case "manyRedirects":
                              break;
                        case "clientError":
                        case "serverError":
                              await this.handleError(options, stats, page);
                              break;
                        default:
                              console.log("SOME THING ELSE?")
                              break;
                  }

            } catch (error) {
                  console.log(error)
            }
            finally {
                  await this.queue.threadEnded(batchId);
            }

            await this.handleNextTasksOrComplete(options);

      }


      async handleSave(options: ProcessOptions, page: ParsedPage, task: Task) {

            if (page.content) page.elements = this.parser.getElements(page.content)
            if (page.elements) sanitizeUris(page.url, page.elements, options.sanitizeOptions)

            // remove any unecessary properties. then map the data to the object for saving
            delete page.content

            const mainPage = PageHelpers.getMappedData(page)
            mainPage.spiderStatus = task.status;

            const data: DataValue[] = []
            data.push(mainPage);

            let subPages = PageHelpers.getPageUrlsToSkip(page)

            subPages= Array.from(
                  subPages.reduce((uniqueMap, obj) => {
                      uniqueMap.set(obj.id, obj);
                      return uniqueMap;
                  }, new Map<string, DataValue>())
                  .values()
              );

            let ids = subPages.map(obj => obj.id); // get list of ids 
     
            ids = await this.queue.checkIgnoreList(options.batchId, ids) // check which have been processed.
                 
            if (!ids || ids.length == 0) return;
  

            for (const item of subPages) {
                  if (ids.find(x => x == item.id)) data.push(item);
            }

            await this.postData(options.batchId, data);

      }

      async handleOkay(options: ProcessOptions, stats: QueueStatus, page: ParsedPage) {
            // if we are at or over max pages we are full
            let isFull = false;
            if (stats.processed > options.maxPages) isFull = true;

            // if we are not full we can queue more items
            if (!isFull && !stats.cancelled) {
                  const urls = PageHelpers.getPageUrlsToProcess(page);
                  await this.queue.queueItems(options.batchId, urls);
            }

      }

      async handleRedirect(options: ProcessOptions, page: ParsedPage, redirects: number, isRoot: boolean) {

            const loc = page.status.location

            redirects += 1;

            if (!loc || redirects > 5) { return; } // this should not happen. page parsing shoudl return as error of redirect and no location.

            const redirectStatus = loc.parsed.status || "notset"
            // if it is the root we can accept any redirect url except invalid.
            // if it is not the root we only want those urls that are internal and we are not filtering. 
            if ((isRoot && redirectStatus !== "invalid") ||
                  (!isRoot && (redirectStatus === "okay" || redirectStatus === "warn"))) {

                  if (loc.parsed.url) {
                        this.queue.queueItems(options.batchId, [{ url: loc.parsed.url, status: redirectStatus, redirects }]);
                  }

            }
            //   we need to check it is a valid url.
            //   if it is the first page anda redirect we accept an external url


            //  shut down the thread. no more work to do.

      }

      async handleError(options: ProcessOptions, tasks: QueueStatus, page: ParsedPage) {

            return;

      }


      async handleNextTasksOrComplete(options: ProcessOptions) {


            const stats = await this.queue.getQueueStats(options.batchId)

            console.log(stats);

            if (stats.threads > options.maxThreads) return; // in case we generated too many

            let threads = 1
            if (stats.threads < options.maxPages) threads +=1
            if (threads > stats.todo) threads = stats.todo;
            
            // while there is work todo keep processing
            if (!stats.cancelled && threads > 0 && stats.todo > 0) {
                  await this.createThreads(options.batchId, threads);
                  return; // must return while work to do.
            }

            // Note there may be other threads finishing off so threads might not have equalled one above.  
            // we should recheck stats to ensure we're not responsible for shutting down.
            if ((stats.todo === 0 && stats.threads === 0) || stats.cancelled) {
                  await this.completion(options, stats);
                  return;
            }

      }



      async createThreads(batchId: string, threads: number) {

            for (let i = 0; i < threads; i++) {
                  const newUrl = `${this.serverOrigin}/spider/nextTask?batchId=${batchId}&isRoot=${false}`
                  //      console.log(newUrl)
                  axios.get(newUrl, { timeout: 10000 })
                        .catch(function (error) {
                              console.log("ERROR Post tasks" + newUrl)

                              if (error.response) {
                                    // The request was made and the server responded with a status code
                                    // that falls out of the range of 2xx
                                    //    console.log(error.response.data);
                                    //    console.log(error.response.status);
                                    //  console.log(error.response.headers);
                              } else if (error.request) {
                                    // The request was made but no rgetesponse was received
                                    // `error.request` is an instance of XMLHttpRequest in the browser 
                                    // and an instance of http.ClientRequest in node.js
                                    //    console.log(error.request);
                              } else {
                                    // Something happened in setting up the request that triggered an Error
                                    //    console.log('Error', error.message);
                              }

                        });


            }
      }

      async postData(batchId: string, dataValue: DataValue[]): Promise<void> {

            const url = `${this.serverOrigin}/data/add`

            const data: any = {}
            data.batchId = batchId;
            data.pages = dataValue;


            axios.post(url, data, { timeout: 10000 })
                  .catch(function (error) {
                        console.log("ERROR posting data: ")
                        if (error.response) {
                              //    console.log("Post data - NONE 200")

                              //     console.log(error.response.data);
                              //      console.log(error.response.status);
                              //      console.log(error.response.headers);
                        } else if (error.request) {
                              //    console.log("Post data - No response")
                              //     console.log(error.request);
                        } else {
                              // Something happened in setting up the request that triggered an Error
                              //    console.log('Post Data Other Error', error.message);
                        }
                  });
      }

      async completion(options: ProcessOptions, stats?: QueueStatus): Promise<void> {
            console.log("COMPLETED")
            console.log(stats)
      }


}


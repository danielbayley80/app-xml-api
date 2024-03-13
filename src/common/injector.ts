import { createInjector } from 'typed-inject';


import { HttpClient } from "../page-request/HttpClient"
import { AppSettings } from './settings';
import { SqlLiteDataStore } from '../data-store/sqlLiteStore';
import { DataService } from '../data-store/DataService';
import { QueueManager } from '../queue/Queue';
import { SpiderProcess } from '../spider/SpiderProcess';
import { DataStoreController } from '../data-store/controller';
import { ProcessController } from '../spider/controller';
import { PageController } from '../page-request/controller';

const siteId = "xml-sitemap-generator";

export class InjectorService {


      static  getTestInjector() {
            // general
            const settings = new AppSettings()
            const httpClient = new HttpClient();
            const dataStore = new SqlLiteDataStore(settings);

            // services
            const dataService = new DataService(settings, dataStore)
            const queueManager = new QueueManager(settings);
            const processItem = new SpiderProcess(settings, httpClient, queueManager);

            // controllers
            const dataStoreController = new DataStoreController(settings, dataService);
   
            const processController = new ProcessController(settings, httpClient, dataService, queueManager,processItem);
            const pageController = new PageController(httpClient);

            const appInjector = createInjector()
                  .provideValue("siteId", siteId)
                  .provideValue("settings", settings)
                  .provideValue("httpClient", httpClient)
                  .provideValue("dataStore", dataStore)
                  //  services
                  .provideValue("dataService", dataService)
                  .provideValue("queueManager", queueManager)
                  .provideValue("processItem", processItem)
                  // controllers 
                  .provideValue("dataStoreController", dataStoreController)
                  .provideValue("processController", processController)
                  .provideValue("pageController", pageController)

            return appInjector;
      }

      static  getInjector() {

   
            // general
            const settings = new AppSettings()
            const httpClient = new HttpClient();
            const dataStore = new SqlLiteDataStore(settings);

            // services
            const dataService = new DataService(settings, dataStore)
            const queueManager = new QueueManager(settings);;
            const processItem = new SpiderProcess(settings, httpClient, queueManager);



            // controllers
            const dataStoreController = new DataStoreController(settings, dataService);
            const processController = new ProcessController(settings, httpClient, dataService, queueManager, processItem);
            const pageController = new PageController(httpClient);

            
            const appInjector = createInjector()

                  .provideValue("dataStoreController", dataStoreController)
                  .provideValue("processController", processController)
                  .provideValue("pageController", pageController)

            return appInjector;

      }

}

export const container = InjectorService.getInjector();

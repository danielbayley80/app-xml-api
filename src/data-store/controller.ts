import { iDataService } from "./DataService";

import { Request, Response } from 'express';




export class DataStoreController {


      public static inject = ['settings', 'dataService'] as const;
      constructor(private settings: GlobalSettings, private dataService: iDataService) { }


       writeData(req: Request, res: Response) {
            const data = req.body;
            const batchId = data.batchId;
            const pages = data.pages;
            try {
                  const result =  this.dataService.writeData(batchId, pages)
                  return res.sendStatus(200).end();

            } catch (error) {

                  console.log("************")
                  console.log(error)
                  console.log("************")
                  return res.sendStatus(500).end();
            }



      }

       getData(req: Request, res: Response) {
            const id = "";
            const data = this.dataService.getAll(id)

            return res.json(data).send().end();
      }


} 
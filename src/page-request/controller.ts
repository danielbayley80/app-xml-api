
import { Request, Response } from 'express';
import {   HttpClient, iHttpClient } from './HttpClient';
import { ElementParser, iParser } from './ParseFunctions';
import { sanitizeUris } from './sanitizer/UrlSanitiser';
import { ProcessOptions } from '../spider/SpiderProcess';


export class PageController {


      parser: iParser;
      options:ProcessOptions;
   //   constructor(httpClient:iHttpClient) {
   //         this.httpClient = httpClient;
 //     }

 public static inject = ['httpClient'] as const;
 constructor(private httpClient : iHttpClient) {
      this.options = new ProcessOptions();
      this.parser = new ElementParser; 

 }


      async getPage(req: Request, res: Response) {
            const urlString = req.query["url"]?.toString();
            const url = this.getUrl(urlString);
            if (url instanceof Error) return res.sendStatus(400).end();
 
            try {
                  const page = await this.httpClient.get(url, 10, 100, false);
                  if (page.content) page.elements = this.parser.getElements(page.content)
                  if (page.elements) sanitizeUris(url, page.elements, this.options.sanitizeOptions)

                                    
                  return res.json(page).end();                  
            } catch (error) {
                  console.log(error);
                  return res.sendStatus(500).end();        
            }


      }



      getUrl(url: string| undefined): string | Error {
            if (!url || url.length < 10) return new Error("Url was too short")
            try {
                  const uri = new URL(url);
                  return uri.href;
            } catch (error) {
                  return new Error("Url was invalid");
            }
      }




} 

 
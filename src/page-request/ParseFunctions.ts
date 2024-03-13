import * as cheerio from 'cheerio';
import { a, area, frame, h1, h2, iframe, img, title, HtmlTag } from './PageTypes';


export interface iParser {
      getElements(html: string): HtmlTag[] ;
}

export class ElementParser {

      

      getElements(html: string): HtmlTag[] {
            
            let $: cheerio.CheerioAPI
            $ = cheerio.load(html);

            
            const elements = this.parseTags(["title", "h1", "h2", "a", "area", "frame", "iframe", "img"], $)



            return elements;
      }

 

      createHTMLElement(tagName: string): HtmlTag {
            switch (tagName.toLowerCase()) {
                  case 'title':
                        return new title();
                  case 'h1':
                        return new h1();
                  case 'h2':
                        return new h2();
                  case 'a':
                        return new a();
                  case 'area':
                        return new area();
                  case 'frame':
                        return new frame();
                  case 'iframe':
                        return new iframe();
                  case 'img':
                        return new img();
                  default:
                        throw new Error("Unsupported tag type")
            }
      }

      parseTags(tags: string[], $: cheerio.CheerioAPI ) {
            const results: HtmlTag[] = [];
            for (const tag of tags ) {
                  const result = this.parseTag(tag, $)
                  results.push(...result);
            }
            return results;
      }

      parseTag(tagName: string, $: cheerio.CheerioAPI): HtmlTag[] {
            const results: HtmlTag[] = [];
            const tagList = $(tagName)
         
          
            for (const result of tagList) {
                  const obj = this.createHTMLElement(tagName);
                  const item = $(result as  cheerio.AnyNode);
 
                  for (const prop in obj) {
                        switch (prop) {
                              case "tag" : break;
                              case "text" : (obj as any)[prop] = item.text();  break;
                              default: (obj as any)[prop] = item.attr(prop); break;
                        }
                  }
                  results.push(obj);
            }
            return results;

      }


}
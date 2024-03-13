
import { parse } from "path";
import { HtmlTag, HtmlTagUri, ParsedPage, ParsedUri, a, area, frame, iframe, img } from "./PageTypes";
import crypto from "crypto"
import { DataValue } from "../data-store/DataService";
import { Task, createHash } from "../queue/Queue";

export class PageHelpers {

      static getId(url: string): string {
            let hash = crypto.createHash('sha1').update(url.toLowerCase()).digest('hex');
            hash = hash.substring(0, 12);
            return hash;
      }

      static load(jsonString: string): ParsedPage {
            const page = new ParsedPage();
            const data = JSON.parse(jsonString);
            page.elements = data.elements;
            return page;
      }

      static findByTag(page: ParsedPage, tagName: string): HtmlTag[] {
            if (!page.elements) return [];
            return page.elements.filter(element => element.tag === tagName);
      }

      static findByTagAttr(page: ParsedPage, tagName: string, attributeName: string): HtmlTag[] {
            if (!page.elements) return [];
            return page.elements.filter(element => element.tag === tagName);
      }

      static getImages(page: ParsedPage) : img[] {

            const images = page.elements?.filter(item => item.tag = "img");
            return images as img[];

      }

      static getPageUrlsToProcess(page: ParsedPage): Task[] {
            if (!page.elements) return [];

            const links: Task[] = [];

            for (const tag of page.elements) {
                  const parsed = ((tag as any).parsed) as ParsedUri | undefined
                  if (!parsed) continue;
                  if (parsed.status !== "okay" && parsed.status !== "warn") continue
                  if (!parsed.url) continue;
                  links.push({url:parsed.url, status:parsed.status, redirects:0});

            }
            return links;
      }

      static getPageUrlsToSkip(page: ParsedPage,): DataValue[] {
            if (!page.elements) return [];

            const links: DataValue[] = []

            for (const tag of page.elements as any[]) {
                  const parsed = ((tag as any).parsed) as ParsedUri | undefined
                  if (!parsed) continue;
                  if (parsed.status == "okay" || parsed.status == "warn") continue

                  const url = parsed.url ?? tag.href ?? tag.src ?? "";

                  links.push({
                        id: createHash(url),
                        url: url,
                        title: "",
                        spiderStatus: parsed.status || "notset",
                        requestStatus: "notset",
                        requestCode: 0

                  });

            }
            return links;
      }

      static getMappedData(page: ParsedPage): DataValue {

            const result: DataValue = {
                  id: createHash(page.url),
                  url: page.url,
                  title : (page.elements?.find(item => item.tag =="title") as any)?.text || "",
                  spiderStatus: "okay",
                  requestStatus: page.status.type,
                  requestCode: page.status.code || 0,
                  data: JSON.stringify(page),
                  content: ""
            }

            return result;

      }



}
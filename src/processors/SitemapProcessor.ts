import { ParsedPage, meta } from "src/page-request/PageTypes";
import { PageHelpers } from "../page-request/PageHelpers";


export type SitemapFrequency = "default" | "none" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
export type SitemapPriority = "default" | "none" | "1.0" | "0.9" | "0.8" | "0.7" | "0.6" | "0.5" | "0.4" | "0.3" | "0.2" | "0.1" | "0.0"
export type FilterType = "default" | "begins" | "ends" | "contains" | "notContains" | "equalTo" | "notEqualTo"
export type TitleTag = "default" | "title" | "h1" | "h2"
export type ModifiedDateType =  "default" | "none" |  "serverDate" |  "todaysDate" | "customDate" 
export type ImagesMode  = "default" | "exclude" |  "include"  


export class SitemapImage {
      url: string = "";
      caption?: string = "";
      title?: string = "";
      licence?: string = "";
      geoLocation?: string = "";
}

export class SitemapUrl {

      title: string = "";
      description: string = "";
      priority: SitemapPriority = "none";
      frequency: SitemapFrequency = "none";
      modifiedDate?: Date;
      //  language: string = "";
      images: SitemapImage[] = [];

}

declare global {
      export interface DataValue {
            sitemap: SitemapUrl
      }
}


export class Filter {
      tag: TitleTag = "title";
      type: FilterType = "default";
      value: string = "*";
      priority: SitemapPriority = "none";
      frequency: SitemapFrequency = "none";
      modType : ModifiedDateType = "none"
      modDate: Date | undefined;
      images: ImagesMode = "exclude";
      order: number = 0;
}

export class XmlSitemapProcess {

      constructor() { }


      calculateProps(page: DataValue) {

            if (page.requestStatus !== "okay") return;


            const filters: Filter[] = [new Filter()];

            if (!filters || filters.length === 0) return;

            const defaultIndex = filters.findIndex(item => item.type === "default");

            const defaultRule = filters[defaultIndex];
            const updatedFilters = filters.filter((_, index) => index !== defaultIndex);


            filters.sort((a, b) => a.order - b.order); // need to ensure filters are applied in order.

            for (const filter of updatedFilters) {
                  if (!isMatch(filter, page.url)) continue;

                  const sitemap = new SitemapUrl();
                  page.sitemap = sitemap;

                  sitemap.title = getTitle(defaultRule, filter, page.data)
                  sitemap.description = getDescription( page.data);
                  sitemap.frequency = getFrequency(defaultRule, filter)
                  sitemap.priority = getPriority(defaultRule, filter)
                  sitemap.modifiedDate = getModified(defaultRule, filter,page.data);

                  const imagesMode = getImagesMode(defaultRule, filter)
                  if (!filter.images || !page.data) continue;
                  const imgs = PageHelpers.getImages(page.data)

                  for (const img of imgs) {
                        if (img.parsed.status !== "okay" && img.parsed.status !== "warn") continue
                        sitemap.images.push({
                              url: img.parsed.url ?? "",
                              caption: img.alt,
                              title: img.title
                        })
                  }
                  break; // we match on first then break out the loop
            }

      }

}

function getTitle(defaultRule:Filter, currentRule: Filter, page: ParsedPage | undefined): string {
      if (!page?.elements) return "";
      if (!currentRule || currentRule.tag == "default") currentRule = defaultRule;
      if (!currentRule) return "";

      const element = page.elements?.filter(item => item.tag == currentRule.tag);
      if (!element) return "";
      return (element[0] as any).text

}

function getDescription( page: ParsedPage | undefined): string {
      if (!page?.elements) return "";
    
      if (!page?.elements) return "";
      const element = page.elements?.filter(item => item.tag == "meta" && (item as any)?.name == "description");
      if (!element) return "";
      return (element[0] as any).text

}

function getModified(defaultRule:Filter, currentRule: Filter, page: ParsedPage | undefined): Date | undefined {
      if (!page?.elements) return undefined;
      if (!currentRule || currentRule.modType == "default") currentRule = defaultRule;
      if (!currentRule) return undefined;

 
}

function getImagesMode(defaultRule:Filter, currentRule: Filter ): ImagesMode {
      
      if (!currentRule || currentRule.images == "default") currentRule = defaultRule;
      if (!currentRule) return "exclude";

      return currentRule.images;

}

function getFrequency(defaultRule:Filter, currentRule: Filter):  SitemapFrequency {
      if (!currentRule || currentRule.frequency == "default") currentRule = defaultRule;
      if (!currentRule) return "none";
      return currentRule.frequency;
}

function getPriority(defaultRule:Filter, currentRule: Filter):  SitemapPriority {
      if (!currentRule || currentRule.priority == "default") currentRule = defaultRule;
      if (!currentRule) return "none";
      return currentRule.priority;
}

function isMatch(filter: Filter, url: string): boolean {

      if (filter.type == "default") return true;

      const filterValue = filter.value.toLowerCase();
      url = url.toLowerCase();

      switch (filter.type) {
            case "begins":
                  return url.startsWith(filterValue);
            case "ends":
                  return url.endsWith(filterValue);
            case "contains":
                  return url.includes(filterValue);
            case "notContains":
                  return !url.includes(filterValue);
            case "equalTo":
                  return url === filterValue;
            case "notEqualTo":
                  return url !== filterValue;
            default:
                  return false; // Default filter always matches
      }
}
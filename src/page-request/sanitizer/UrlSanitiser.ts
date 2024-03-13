import { HtmlTag, ParsedUri } from "../PageTypes"
import { SafeUrl } from "./SafeUrl"
import { excludeExtension, removeQueryString } from "./helpers"

export type FilterMode = "ExcludeMatch" | "IncludeMatch"


export class SanitizeOptions {
      ignoreParameters?: string[] = ["sessionId", "session_id", "sid", "sessid", "phpsessid"]

      extensionMode: FilterMode = "ExcludeMatch"
      extensions?: string[] = ["jpeg", "jpg", "gif", "svg", "png", "tif", "tiff", "bmp", "webp", "mp4", "avi", "mov", "wmv", "mkv", "mp3", "wav", "m4a", "wma", "aac"]

      filtermode?: FilterMode
      filters?: string[] = [];
}


export function sanitizeUris(base: string, elements: HtmlTag[], options: SanitizeOptions = new SanitizeOptions()): void {
      for (const element of elements) {
            const val = (element as any).src || (element as any).href
            if (val && val.length > 0) {
                  let url = sanitizeUri(base, val as string, options);
                  (element as any).parsed = url;
            }
      }
}

export function sanitizeUri(base: string, rawUrl: string, options: SanitizeOptions = new SanitizeOptions()): ParsedUri {


      if (base.startsWith("//")) return { status: "protocol", msg: "No baseurl protocol" }
      const baseUrl = new URL(base);

  
      const url = new SafeUrl(base,rawUrl);
 
 

      if (url.isError)  return { status: "invalid" }
      if (!url.isHttp) return {status : "protocol"}
      if (url.isExternal) return {status : "external"}
      if (excludeExtension(url.extension, options)) return { status: "extension" }

      const urlString = removeQueryString(url.absoluteUrl, options)

      if (url.isWarning) {
            return { url:urlString , status: "warn" } 
      }

      return { url:urlString , status: "okay" }

}


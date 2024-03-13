import { join } from "path";
import { ParsedUri } from "../PageTypes";
import { SanitizeOptions } from "./UrlSanitiser";


export function removeQueryString(url: string, options: SanitizeOptions): string {

      // if there are no options we are not filtering.
      if (!options.ignoreParameters ||options.ignoreParameters.length === 0) return url;

      const [baseUrl, queryString] = url.split('?');
      const params = options.ignoreParameters ;
      if (!queryString) {
            return baseUrl;
      }
      
      const parts = queryString.split("&")
      const newQuery :string[] = [];
      for (const part of parts) {
            const name = part.split("=")[0].toLowerCase();
            const result = params.find(x => x.toLowerCase() == name);
            if (result) continue;
            newQuery.push(part)
      }


      if (newQuery.length > 0) {      
            const updatedQueryString = newQuery.join("&")
            return `${baseUrl}?${updatedQueryString}`
      }

      return baseUrl


}


      export function excludeExtension(extension: string, options: SanitizeOptions): boolean {

            // if there are no options we are not filtering.
            if (!options.extensionMode || !options.extensions || options.extensions.length === 0) return false;

            const isMatch = options.extensions.some(ext => ext.toLowerCase() === extension.toLowerCase())

            // if we are excluding a match and there is a match return true
            if (options.extensionMode == "ExcludeMatch" && isMatch) return true;
            // if we are only including matches and there is no match return true.
            if (options.extensionMode == "IncludeMatch" && isMatch) return true;
            // otherwise dont exclude
            return false;
      }






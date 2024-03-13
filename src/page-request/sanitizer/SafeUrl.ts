


export class SafeUrl {

      //   status: UriStatus

      isExternal: boolean = false; //  is it external to the base url?
      //    isValid: boolean = true;    // is it a valid url?
      isHttp: boolean = false;  // is this an http or https url?
      isWarning: boolean = false;
      isError: boolean = false;
      isAbsolute: boolean = false;
      messages: string[] = [];

      protocol: string = "";
      root: string = "";
      extension: string = "";
      hash: string = "";

      hasQueryString: boolean = false;
      querystring: string = ""
      path: string = "";

      absoluteUrl: string = "";
      relativeUrl: string = "";

      //   baseUrl: string = "";
      baseProtocol: string = "";
      originalValue: string = "";

      // used internally for proecssing
      private workingUrl: string = "";
      private baseUrl: string = "";
      private base: URL;
      private url!: URL;

      constructor(base: string, url: string) {
            this.originalValue = url;
            this.workingUrl = url;
            this.base = new URL(base)


            if (!this.parseBase(base)) return;


            // check if it is external / absulte and set the working and base accordingly.
            this.parseInitial()

            if (this.isError) return;

            this.parseQueryString(); // note : this strips it from the working url
            this.parseHash();             // strips it from the working url


            this.parseExtension();

            if (!this.isAbsolute) this.parseAbsolute() // working url is now absolute. 

            this.parseParts() // splits the root address from the path

            this.validationChecks() // attempts to identify any other oddities.


      }

      private parseHash() {
            const urlParts = this.workingUrl.split("#");
            if (urlParts.length > 1) {
                  this.workingUrl = urlParts[0];
                  this.hash = urlParts[1];
            }
      }
      private parseInitial() {
            const urlParts = this.workingUrl.split("/");
            const baseParts = this.baseUrl.split("/")

            this.baseProtocol = this.base.protocol.toLowerCase();

            const protocolLess = (this.workingUrl.startsWith("//") && urlParts[2].includes("."))

            if (urlParts[0].includes(":") || protocolLess ) {
                  this.isAbsolute = true;
                  if (this.workingUrl.startsWith("//")) {

                        this.workingUrl = this.baseProtocol + this.workingUrl

                        this.isWarning = true
                        this.messages.push("Assumed protocol-less '//'")
                  } 
                  try {
                        this.url = new URL(this.workingUrl);
                         this.isExternal = (this.url.host.toLowerCase() !== this.base.host || this.url.port !== this.base.port)
                  } catch (error  ) {
                        this.isError = true;
                        this.messages.push((error as any).toString())
                  }
              

                  if (this.isHttp && this.baseProtocol !== this.protocol) {
                        this.isWarning = true;
                        this.messages.push("http and https in use")
                  }
                  this.root = this.workingUrl.split("/").splice(0,3).join("/")
            } else {
                  this.root = this.baseUrl.split("/").splice(0,3).join("/")
                  
            }
                  try {
                        this.url = new URL(this.workingUrl, this.baseUrl);
                  } catch (error  ) {
                        this.isError = true;
                        this.messages.push((error as any).toString())
                  }
            this.workingUrl = this.workingUrl.split("#")[0];
            this.protocol = this.url?.protocol.toLowerCase();
            
            


            if (this.protocol == "http:" || this.protocol == "https:") { this.isHttp = true; }



            this.workingUrl = this.workingUrl.replace(this.root, "");




      }


      private parseBase(base: string): boolean {
            if (base.startsWith("//")) {
                  this.isError = true;
                  this.messages.push("Base URL cannot be protocol-less");
                  return false;
            }


            try {
                  this.base = new URL(base);
                  this.baseProtocol = this.protocol;
                  this.baseUrl = base;
            } catch (error) {
                  this.isError = true;
                  this.messages.push("Base URL could not be parsed");
                  return false;
            }

            return true
      }


      private parseQueryString() {
            const parts = this.workingUrl.split("?")
            if (parts.length > 0) {
                  this.hasQueryString = true;
                  this.querystring = parts[1] || "";
            } else if (parts.length > 1) {
                  this.isError = true;
                  this.messages.push("Multiple '?' found")
            }
            this.workingUrl = parts[0];
      }

      private parseExtension() {
            this.extension = getFileExtension(this.workingUrl)
      }



      private parseAbsolute() {

            this.workingUrl = SafeUrl.getAbsolute(this.baseUrl, this.workingUrl, this.messages);


      }

      private parseParts() {
            const endsWithSlash: boolean = (this.workingUrl.endsWith("/"))
            const parts = this.workingUrl.split("/");

            this.path = this.workingUrl.replace(this.root, "");

            if (this.querystring && this.querystring.length > 0) {
                  this.absoluteUrl = this.root + this.path + "?" + this.querystring;
            } else {
                  this.absoluteUrl = this.root + this.path;
            }


            if (this.querystring && this.querystring.length > 0) {
                  this.relativeUrl = this.path + "?" + this.querystring;
            } else {
                  this.relativeUrl = this.path;
            }
      }

      // do some basic checks to look for bad urls
      private validationChecks() {
            let urlRegex;

            // common error to have this in a url
            if (this.path.includes("//")) {
                  this.messages.push("Double slash in path")
            }


            if (isMalformedURL(this.originalValue)){
                                  this.isWarning = true;
                  this.messages.push("Possible malformed https://")  
            }
        // common error to have this in a url
            const orig = this.originalValue.toLowerCase()
        /*        if (this.isAbsolute && this.protocol !== this.url.protocol) {
                  this.isWarning = true;
                  this.messages.push("Possible malformed https://")
            } */

            if (orig.split("?").length > 2) {
                  this.isWarning = true;
                  this.messages.push("Multiple '?' detected")
            }

            if (this.path.includes("//")) {
                  this.isWarning = true;
                  this.messages.push("Multiple '//' in path")
            }

            urlRegex =/^\.(?![\.\/])/
            if (urlRegex.test(this.originalValue)) {
                  this.isWarning = true;
                  this.messages.push("Possible malformed '.'")
            }


            // check for anything that looks like a script
            urlRegex = /javascript|<\s*script\s*>|<\/\s*script\s*>|document\.|window\./gi;
            if (urlRegex.test(this.originalValue)) {
                  this.messages.push("")
                  this.isHttp = false;
                  this.isWarning = true;
                  this.messages.push("Script detected")
            }
            // common bad characters which may be from sciprting etc.
            urlRegex = /[@\[\]()$£!:\(\)<>;]/g;
            if (urlRegex.test(this.path)) {
                  this.isWarning = true;
                  this.messages.push("Unexpected characters in path")
            }

            urlRegex = /[@\[\]()$£!\(\)]/g;
            if (urlRegex.test(this.root)) {
                  this.isError = true;
                  this.messages.push("Unexpected characters in domain")
            }

            try {

                  const ur = new URL(this.absoluteUrl)

                  // we could check for parsing descrepancies here.
            } catch (error) {
                  this.messages.push("Error parsing")
                  this.isError = true;
            }


            return true;
      }


      public static getAbsolute(baseUrl: string, relativeUrl: string, messages?: string[]): string {


            // if there is no relative url just return the base
            if (relativeUrl.length == 0) return baseUrl;

            // if realtive url is just a query string append it to the base.
            if ((relativeUrl.charAt(0) === "?")) return baseUrl + relativeUrl;

            // prep for processing Trim trailing slashes from base URL
            baseUrl = baseUrl.replace(/\/+$/, '');

            // if the url is just a root based url 
            const isRelative = relativeUrl.includes("../")

            // if the base url contains a filename remove it.
            let baseSegments = baseUrl.split("/")

            // check if the last segment has a "." but only if it has more than 3 segments
            const baseHasFile: boolean = (baseSegments.length > 3 && baseSegments[baseSegments.length - 1].includes("."));

            if (baseHasFile) {
                  baseSegments = baseSegments.splice(0, baseSegments.length - 1)
                  baseUrl = baseSegments.join("/")
            }

            // if it is relative to the current file or folder we can remove this.
            if (relativeUrl.startsWith("./")) relativeUrl = relativeUrl.slice(2);



            // if the url starts with a slash and has no relative parts we can return it with the root
            if (relativeUrl.startsWith("/") && !isRelative) return SafeUrl.getRoot(baseUrl) + relativeUrl;
            // if it does not start with a slash but also has no relative parts we can returl direct to the base.
            if (!relativeUrl.startsWith("/") && !isRelative) return baseUrl + "/" + relativeUrl;

            // at this point we need to parse out any ../

            // remove the query string to avoid quirks.
            let query = "";
            const queryParts = relativeUrl.split("?");
            relativeUrl = queryParts[0]
            if (queryParts.length > 1) query = queryParts[1]

            //    0 1 2           3  4
            // http://example.com/en/test
            const depth = baseSegments.length - 3;
            let rel = SafeUrl.countRelativePathSegments(relativeUrl);

            if (rel > depth) {
                  if (messages) messages.push("Relative path incorrect")
                  rel = depth;
            }

            // remove a number of folders to the relative path
            baseSegments = baseSegments.splice(0, baseSegments.length - rel)
            baseUrl = baseSegments.join("/")
            baseUrl += "/" + relativeUrl.replace(/^(\.\.\/)+/, "");;

            if (query.length > 0) { baseUrl += "?" + query; }

            return baseUrl;
      }


      static getRoot(url: string): string {
            return url.split("/").slice(0, 3).join("/");

      }

      static countRelativePathSegments(url: string): number {
            let count = 0;

            // Check for consecutive occurrences of '../' at the start of the string
            while (url.startsWith('../')) {
                  count++;
                  // Remove the '../' from the beginning of the string
                  url = url.slice(3);
            }

            return count;
      }

}

export function  isMalformedURL(url: string): boolean {
      const malformedPatterns = [
          /^http\/\//,
          /^https\/\//,
          /^http:\/(?!\/)/,
          /^https:\/(?!\/)/,
          /^htp:/,
          /^htps:/,
   
      ];
  
      return malformedPatterns.some(pattern => pattern.test(url));
  }

export function getFileExtension(url: string): string {
      let parts = url.split("?");
      parts = parts[0].split("#")
      parts = parts[0].split("/")

      const file = parts[parts.length - 1];
      parts = file.split(".")

      if (parts.length == 2) { return parts[1].toLowerCase() }

      return "";
}

export function getUrlProtocol(url: string): string {
      url = url.toLowerCase();
    
      const protocolRegex = /^(.*?):\//;
      const match = url.match(protocolRegex);
      const result = match ? match[1] : "";

      return result.toLowerCase() + ":";
}
import https from 'https';
import http from 'http';
import zlib from 'zlib';

import { ParsedPage, RedirectLocation } from './PageTypes';
import { sanitizeUri } from './sanitizer/UrlSanitiser';


export interface iHttpClient {
      get(url: string, timeoutSeconds: number, maxKB: number, headersOnly: boolean): Promise<ParsedPage>
}

export class HttpClient implements iHttpClient {

      private getPort(url: URL): number {
            let port = parseInt(url.port);  // if there is an explicit port in the url
            if (isNaN(port)) {            // if not an explicit port
                  port = 443;
                  if (url.protocol === "http:") port = 80;
            }
            return port;
      }

      private getHeaders() {

            // we might want to rotate these or set in config
            const headers = {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:76.0) Gecko/20100101 Firefox/76.0",
                  "Accept-Encoding": "gzip, deflate",
                  "Accepts": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            };
            return headers;
      }

      private getRequestOptions(u: URL): https.RequestOptions {
            const options: https.RequestOptions = {
                  hostname: u.hostname,
                  path: u.pathname + u.search,
                  port: this.getPort(u),
                  method: 'GET',
                  rejectUnauthorized: false,
                  headers: this.getHeaders()
            };
            return options;

      }



      private getDate(val?: string): Date | undefined {
            if (val && val.length > 8) return new Date(val);
            return undefined;
      }

      private getNumber(val?: string): number | undefined {
            const parsed = parseInt(val as string);
            if (isNaN(parsed)) { return undefined; }
            return parsed;
      }

      private isTextHtml(contentType?: string): boolean {
            if (!contentType) return false;
            if (contentType.startsWith("text") && contentType.includes("html")) return true;
            return false;
      }




      async get(url: string, timeoutSeconds: number, maxKB: number, headersOnly: boolean = false): Promise<ParsedPage> {


            return new Promise(async (resolve, reject) => {

                  const cleanUpAndResolve = function () {
                        clearTimeout(timeout);
                        req.destroy();
                        resolve(pr);
                  }

                  const onError = function (error: any) {
                        switch (error.code) {
                              case "ENOTFOUND":
                                    pr.status.desc = "DNS not found";
                                    break;
                              default:
                                    pr.status.desc = error.message;
                                    break;
                        }
                        pr.status.type = "clientError";


                        cleanUpAndResolve();
                  }

                  const endData = function () {
                        pr.content = Buffer.concat(buffer).toString();
                        cleanUpAndResolve();
                  }

                  const getData = function (chunk: Uint8Array) {
                        hasResponded = true;
                        buffer.push(chunk);
                        if ((buffer.length / 1000) >= maxKB) {
                              pr.status.desc = `content exceeded ${maxKB} KB`;
                              pr.status.isTruncated = true;
                              endData();
                        }
                  }

                  const timeOut = function () {
                        pr.status.type = "clientError"
                        if (!hasResponded) {   // we had yet to receive anything back from the service 

                              pr.status.desc = `failed to respond within ${timeoutSeconds} seconds`;
                              cleanUpAndResolve();
                              return;
                        }
                        pr.status.desc = "content truncated due to timeout"
                        pr.status.isTruncated = true;
                        endData();
                        return;
                  }


                  const u = new URL(url);
                  const timeout = setTimeout(timeOut, timeoutSeconds * 1000);
                  const options = this.getRequestOptions(u);
                  const pr = new ParsedPage();

                  let client; // is there an easier/better way to do this?
                  if (u.protocol == "http:") client = http;
                  else client = https;

                  let hasResponded: boolean = false;
                  let buffer: Uint8Array[] = [];

                  const req = client.request(options, res => {
                        hasResponded = true;





                        for (const name in res.headers) {
                              const value = res.headers[name] as string;
                              pr.headers[name] = value
                        }

                        const contentType = res.headers['content-type'] ?? ""
                        const isText = contentType.startsWith('text/html') || contentType.startsWith('application/xhtml+xml')

                        const status = res.statusCode || -1;
                        pr.url = url;
                        pr.status.code = status
                        pr.status.desc = res.statusMessage;
                        pr.status.isHtml = isText;
                        pr.status.modified = this.getDate(res.headers['last-modified']);

                        //     pr.contentLength = this.getNumber(res.headers['content-length']);


                        switch (true) {
                              case (status === -1):
                                    pr.status.type = "notset"
                                    break;
                              case (status === 200):
                                    pr.status.type = "okay";
                                    break;
                              case (status >= 300 && status <= 399):
                                    pr.status.location = new RedirectLocation()
                                    // we need to check the URL is valid to some degree and skip to error if not.
                                    // were assumign server error because location should be populated.
                                    pr.status.location.url = res.headers['location'] ?? "";
                                    pr.status.location.parsed = sanitizeUri(url, pr.status.location.url)
                                   let s = pr.status.location.parsed.status  
                                    if (s== "invalid" || s == "protocol") {
                                          pr.status.type = "serverError";
                                    } else {
                                          pr.status.type = "redirect";
                                    }
                                    
                                    break;
                              case (status >= 400):
                                    pr.status.type = "serverError";
                                    break;
                              default:
                              // default case if none of the conditions match
                        }

                        if (pr.status.type !== "okay" || pr.status.isHtml == false) {
                              cleanUpAndResolve();
                              return;
                        }

                        const encoding = res.headers['content-encoding'];
                        switch (encoding) {
                              // or, just use zlib.createUnzip() to handle both cases
                              case 'gzip':
                                    res.pipe(zlib.createGunzip()).on('data', getData).on('end', endData).on('error', onError);
                                    break;
                              case 'deflate':
                                    res.pipe(zlib.createInflate()).on('data', getData).on('end', endData).on('error', onError);
                                    break;
                              default:
                                    res.on('data', getData).on('end', endData).on('error', onError);
                                    break;
                        }

                  });
                  req.on("error", onError);
                  req.end();


            }); // promise
      } // function
} // class


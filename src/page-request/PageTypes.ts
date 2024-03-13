import { inherits } from "util";




export class ParsedPage {
      url: string = "";
      status: RequestResponse = new RequestResponse();
      headers: Record<string, string> = {}
      content?: string;
      elements?: HtmlTag[] = [];

  }


export type RequestStatus = "notset" | "okay" | "serverError" | "clientError" | "redirect" | "manyRedirects"

export class RequestResponse {

      type : RequestStatus = "notset"

      code?: number ;
      desc?: string;
      modified?: Date;
      location?: RedirectLocation;
      isHtml?: boolean ;
      isTruncated?: boolean ;

}

export type UriStatus = "notset" | "okay" | "warn" | "invalid" | "external" | "extension" | "http" | "filtered" | "text" | "protocol"
export class ParsedUri {
      url?: string = "";
      status?:UriStatus;
      msg?:string;
}

export interface HtmlTag {
      tag: string; 
  }

  export interface HtmlTagUri extends HtmlTag {
      parsed?: ParsedUri
  }

  export class RedirectLocation {
      url : string = "";
      parsed:ParsedUri = new ParsedUri();
  }

  export class baseUri implements HtmlTagUri {
        parsed: ParsedUri = new ParsedUri();
        tag: string = "";

  }
  
  export class title implements HtmlTag {
      constructor() {}
      //   constructor(text: string) {this.text = text; }
   
         tag = 'title';
         text: string = '';
     }
  
     export class meta implements HtmlTag {
            tag = "meta";
            name: string = "";
            property: string = "";
            content: string = "";
     }
     
  export class h1 implements HtmlTag {
   //   constructor(text: string) {this.text = text; }

      tag = 'h1';
      text: string = '';
  }
  
  export class h2 implements HtmlTag {
    //  constructor(text: string) {    this.text = text;}
      tag = 'h2';
      text: string = '';
  }
  
  export class a extends baseUri implements HtmlTagUri{
     //  constructor(href: string, title:string) { this.href = href;  this.title = title;  }
      tag = 'a';
      text: string = "";
      href: string = '';
      title: string = '';
  }
  
  export class area extends baseUri implements HtmlTagUri  {
    //  constructor(href: string, text:string) {    this.href = href; this.text = text;  }
      tag = 'area';
      href: string = '';
      text: string = '';
  }
  

  export class img extends baseUri implements HtmlTagUri{
      // constructor(src: string, alt: string, title: string) {  this.src = src;   this.alt = alt;  this.title = title; }

      tag = 'img';
      src: string = '';
      title: string = '';
      alt: string = '';
  }
  
  export class iframe extends baseUri implements HtmlTagUri {
   //   constructor(href: string, title:string) {   this.src = href;  this.title = title; }
      tag = 'iframe';
      src: string = '';
      title: string = '';
  }

  export class frame extends baseUri implements HtmlTagUri {
    //  constructor(href: string, title:string) { this.src = href;   this.title = title;  }
      tag = 'frame';
      src: string = '';
      title: string = '';
  }

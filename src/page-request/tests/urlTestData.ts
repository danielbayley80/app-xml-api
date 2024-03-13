import { UriStatus } from "../PageTypes";

export class TestData {
      public base?: string;
      constructor(

            public id: string,
            public url: string, // url to test
          public expect: string | undefined, // expected parsed url
            public status: UriStatus) { }

} 


export const urlTestData  :TestData[] = [
      // basic check

      

      {id:"101", url: "/path/to/resource?query=123", expect: "https://example.com/path/to/resource?query=123", status: "okay" },
      {id:"102", url: "path/to/resource?query=123", expect: "https://example.com/path/to/resource?query=123", status: "okay" },
      {id:"103", url: "/path/to/resource?query=123", expect: "https://example.com/path/to/resource?query=123", status: "okay" },
      {id:"104", url: "/path/to/resource/very/very/very/long/link/to/some/url/index.html?query=122323232323&apt=232323232323jfjfjfjfjfjfjfjfjfjfjjfj", 
      expect: "https://example.com/path/to/resource/very/very/very/long/link/to/some/url/index.html?query=122323232323&apt=232323232323jfjfjfjfjfjfjfjfjfjfjjfj", status: "okay" },
      {id:"105a", url: "/", expect: "https://example.com/", status: "okay" },
      {id:"105b", url: "", expect: "https://example.com", status: "okay" },
      {id:"106a", base:"https://example.com/", url: "/", expect: "https://example.com/", status: "okay" },
      {id:"106b", base:"https://example.com/", url: "", expect: "https://example.com/", status: "okay" },
      {id:"107", base:"https://example.com/f1/f2/", url: "../test/?test=1", expect: "https://example.com/f1/test/?test=1", status: "okay" },
      {id:"108", base:"https://example.com/f1/f2", url: "../../test/?test=1", expect: "https://example.com/test/?test=1", status: "okay" },
      {id:"109", base:"https://example.com/f1/f2/f3", url: "../../test/?test=1", expect: "https://example.com/f1/test/?test=1", status: "okay" },
      {id:"110", base:"https://example.com/f1/f2/f3", url: "../../f4/f5/?test=1", expect: "https://example.com/f1/f4/f5/?test=1", status: "okay" },
      {id:"111", base:"https://example.com/f1/f2", url: "./test/?test=1", expect: "https://example.com/f1/f2/test/?test=1", status: "okay" },
      {id:"112", base:"https://example.com/f1/f2/", url: "./test/?test=1", expect: "https://example.com/f1/f2/test/?test=1", status: "okay" },
      {id:"113", base:"https://example.com/f1/f2/", url: "./test?test=1", expect: "https://example.com/f1/f2/test?test=1", status: "okay" },
      {id:"115`", url: "/test?test=1", expect: "https://example.com/test?test=1", status: "okay" },
      {id:"120", url: "/test/?test=1", expect: "https://example.com/test/?test=1", status: "okay" },
      {id:"121", url: "?test=123", expect: "https://example.com?test=123", status: "okay" },
      {id:"122", url: "/?test=123", expect: "https://example.com/?test=123", status: "okay" },
      {id:"124", url: "http://example.com/test?test=1", expect: "http://example.com/test?test=1", status: "okay" },


      {id:"125", url: "testing/?test=123", expect: "https://example.com/testing/?test=123", status: "okay" },
      {id:"126", url: "/test/com/?test=123", expect: "https://example.com/test/com/?test=123", status: "okay" },
      // check session ID is removed regardless of position
      {id:"201", url: "/path/to/resource?query=123&test=234234&sessionId=1234", expect: "https://example.com/path/to/resource?query=123&test=234234", status: "okay" },
      { id:"202",url: "/path/to/resource?query=123&sessionId=1234&test=234234", expect: "https://example.com/path/to/resource?query=123&test=234234", status: "okay" },
      {id:"203", url: "/path/to/resource?sessionId=1234&query=123&test=234234", expect: "https://example.com/path/to/resource?query=123&test=234234", status: "okay" },
      {id:"204", url: "/path/to/resource?SeSSion_Id=1234&query=123&test=234234", expect: "https://example.com/path/to/resource?query=123&test=234234", status: "okay" },
      {id:"205", url: "https://example.com/to/resource?SId=1234&query=123&test=234234", expect: "https://example.com/to/resource?query=123&test=234234", status: "okay" },
      // check extension
      {id:"301a", url: "http://example.com/path/to/resource.gif", expect: undefined, status:"extension"},
      {id:"301b", url: "https://example.com/path/to/resource.gif", expect: undefined, status:"extension"},
      {id:"302",  url: "https://example.com/path/to/resource.gif?query=123&test=234234&sessionId=1234", expect: undefined, status:"extension" },
      {id:"303",  url: "/path/to/resource?query=123&test=.gif", expect: "https://example.com/path/to/resource?query=123&test=.gif", status: "okay" },
      { id:"304", base:"https://example.gif",  url: "/path/to/resource?query=123&test=.gif&sessionId=1234", expect: "https://example.gif/path/to/resource?query=123&test=.gif", status: "okay" },
      {id:"305", base:"https://example.gif",  url: "/path/to/resource?query=123&test=.gif#.gif", expect: "https://example.gif/path/to/resource?query=123&test=.gif", status: "okay" },
      // protocol-less
      {id:"401",  url: "//www.example.com.info/page/?query=123", expect: undefined, status: "external" },
      {id:"402",  url: "//example.com/page/?query=123", expect: "https://example.com/page/?query=123", status: "warn"},
      {id:"403", url: "//example.com/path/to/resource.gif", expect: undefined, status:"extension"},
      {id:"404", base:"//example.com", url: "//example.com/path/to/resource?sessionId=1234&query=123&test=234234", expect: undefined, status: "protocol" },
      {id:"405", base:"https://example.com", url: "//www.example.com/page/?query=123", expect: undefined, status: "external" },
      {id:"406", base:"https://example.com", url: "http://www.example.com/page/?query=123", expect: undefined, status: "external" },
      // bad urls
      {id:"501",  url: ".example.gif.info/path/to/resource?query=123#asdasds", expect: "https://example.com/.example.gif.info/path/to/resource?query=123", status: "warn" },
      {id:"502",  url: "#//www.example.gif.notsensible/path/to/resource?query=123#asdasds", expect: "https://example.com",  status: "okay"  },
      {id:"503",  url: "example.com/path/to/resource?query=123&test=234234", expect: "https://example.com/example.com/path/to/resource?query=123&test=234234",  status: "okay"  },
      {id:"504",  url: "http://example.com/path/to/resource???query=123&test=234234", expect: "http://example.com/path/to/resource",  status: "warn" },
      {id:"505",  url: "example.com/path/to/resource?test=234234", expect: "https://example.com/example.com/path/to/resource?test=234234",  status: "okay" },
      {id:"506",  url: "http://example.com/path/to/resource?@@query=123&test=234234", expect: "http://example.com/path/to/resource?@@query=123&test=234234",  status: "okay" },
      {id:"507",  url: "IdoSomething()", expect: "https://example.com/IdoSomething()",  status: "warn" },
      {id:"508",  url: "ftp://example.com", expect: undefined,  status: "protocol" },
      {id:"509", url: "http://@example.com/path/to/resource??query=123&test=234234", expect: undefined,  status: "invalid" },
      {id:"510",  url: "@", expect:"https://example.com/@",  status: "warn" },
      {id:"511",  url: "http//example.com/test", expect: "https://example.com/http//example.com/test",  status: "warn" },
      {id:"512",  url: "http:/example.com", expect: "http:/example.com",  status: "warn" },
      {id:"514", url: "https://example.com///", expect: "https://example.com///", status: "warn" },
      {id:"515", url: "////", expect: undefined, status: "invalid" },
      {id:"516", url: "<>", expect: "https://example.com/<>", status: "warn" },

      // none utf-8 - we want to persist these for the UI we can encode later for output
      { id:"601",url: "عمليات-التجميل/", expect: "https://example.com/عمليات-التجميل/", status: "okay" },
      { id:"602",url: "/杂货/薄荷", expect: "https://example.com/杂货/薄荷", status: "okay" },
      { id:"603",url: "gemüse", expect: "https://example.com/gemüse", status: "okay" },
      { id:"604",url: "gemüse/gemüse", expect: "https://example.com/gemüse/gemüse", status: "okay" },
      { id:"604", base:"https://gemüse.com/", url: "/gemüse", expect: "https://gemüse.com/gemüse", status: "okay" },
      { id:"605",url: "/عمليات-التجميل/عمليات-التجميل/", expect: "https://example.com/عمليات-التجميل/عمليات-التجميل/", status: "okay" },

      // external
      {id:"701", base:"https://www.example.com", url: "https://example.com/path/to/resource?query=123", expect: undefined, status: "external"},
      {id:"702", url: "https://www.example.com/path/to/resource?query=123", expect: undefined, status: "external"},
      {id:"703",  url: "https://abc.example.info/path/to/resource?query=123", expect: undefined, status: "external"},
      {id:"704",  url: "http://1example.com/path/to/resource?query=123",expect: undefined, status: "external"},
      {id:"705",  url: "https://www.example.gif.info/path/to/resource?query=123", expect: undefined, status: "external"},

      // TLDs
      {id:"801", base:"https://www.example.directory" , url: "?query=123", expect: "https://www.example.directory?query=123", status: "okay" },
      {id:"802", base:"http://www.example.gif.infod",  url: "?query=123", expect: "http://www.example.gif.infod?query=123", status: "okay" },
      {id:"803", base:"http://www.example.gif.another",  url: "/page/?query=123", expect: "http://www.example.gif.another/page/?query=123", status: "okay" },
      {id:"804", base:"https://www.example.directorycrazy" , url: "?query=123", expect: "https://www.example.directorycrazy?query=123", status: "okay" },
      // None root base


]


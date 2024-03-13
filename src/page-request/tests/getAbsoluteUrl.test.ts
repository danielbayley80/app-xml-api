import { SafeUrl  } from "../sanitizer/SafeUrl";

 

 

const urlTestData: any[] = [
      // Paths starting with and without /
      { base: "http://example.com", rel: "", expect: "http://example.com" },
      { base: "http://example.com", rel: "/", expect: "http://example.com/" },
      { base: "http://example.com", rel: "page1", expect: "http://example.com/page1" },
      { base: "http://example.com", rel: "en/", expect: "http://example.com/en/" },
      { base: "http://example.com", rel: "/en/", expect: "http://example.com/en/" },
      { base: "http://example.com", rel: "en", expect: "http://example.com/en" },
      { base: "http://example.com", rel: "/en", expect: "http://example.com/en" },
      { base: "http://example.com", rel: "/?test=123", expect: "http://example.com/?test=123" },
 
      // URLs where the query ? is immediately following a / or a file or folder
      { base: "http://example.com/folder", rel: "./test", expect: "http://example.com/folder/test" },
      { base: "http://example.com/folder/", rel: "./test", expect: "http://example.com/folder/test" },
      { base: "http://example.com/folder/index.html", rel: "./test", expect: "http://example.com/folder/test" },
      { base: "http://example.com", rel: "?param=value", expect: "http://example.com?param=value" },
      { base: "http://example.com", rel: "/?param=value", expect: "http://example.com/?param=value" },
      { base: "http://example.com", rel: "/page1?param=value", expect: "http://example.com/page1?param=value" },
      { base: "http://example.com", rel: "page1?param=value", expect: "http://example.com/page1?param=value" },
      { base: "http://example.com", rel: "/page1/index.html?param=value", expect: "http://example.com/page1/index.html?param=value" },
      { base: "http://example.com", rel: "/page1/?param=value", expect: "http://example.com/page1/?param=value" },
      { base: "http://example.com", rel: "/page1/index.html/?param=value", expect: "http://example.com/page1/index.html/?param=value" },
      // Cases where the . and .. are used
      { base: "http://example.com", rel: "./page1", expect: "http://example.com/page1" },
      { base: "http://example.com", rel: "../page2", expect: "http://example.com/page2" },
      // Various depths of base path
      { base: "http://example.com/en", rel: "/", expect: "http://example.com/" },
      { base: "http://example.com/en", rel: "/page1", expect: "http://example.com/page1" },
      { base: "http://example.com/en/test/", rel: "/page1/index.html", expect: "http://example.com/page1/index.html" },
      { base: "http://example.com/en", rel: "/page1/index.html?param=value", expect: "http://example.com/page1/index.html?param=value" },
      { base: "http://example.com/en", rel: "./page1", expect: "http://example.com/en/page1" },
      { base: "http://example.com/en/", rel: "./page1", expect: "http://example.com/en/page1" },
      { base: "http://example.com/en", rel: "../page2", expect: "http://example.com/page2" },
      { base: "http://example.com/en", rel: "../../../page3", expect: "http://example.com/page3" },
      { base: "http://example.com/en/f2/f3/f4", rel: "../../../page3", expect: "http://example.com/en/page3" },
      { base: "http://example.com/en/f2/f3/f4", rel: "./../../../page3", expect: "http://example.com/en/page3" },


    ];
    
    export default urlTestData;
    


describe('getAbsoluteUrl', () => {


      for (const item of urlTestData) {

            it(`base ${item.base} rel ${item.rel}`, async () => {
                  expect(SafeUrl.getAbsolute(item.base, item.rel)).toBe(item.expect);
            });


      }
 
});

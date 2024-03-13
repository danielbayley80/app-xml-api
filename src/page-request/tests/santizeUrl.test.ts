import { ParsedUri, UriStatus } from "../PageTypes";
import { SanitizeOptions, sanitizeUri } from "../sanitizer/UrlSanitiser";
import { TestData, urlTestData } from "./urlTestData";

describe('sanitizeUri function', () => {
      const base = 'https://example.com'; // Define the base URL for all tests


   

            for (const item of urlTestData) {

                  it(`${item.id} test case`, async () => {
                        let thisBase = base;
                        if (item.base) {thisBase = item.base}
                        const parsedUri = sanitizeUri(thisBase, item.url); // Call the sanitizeUri function with the current URL
                        expect(parsedUri.status).toEqual(item.status); // Check if the status matches the expected status
                        expect(parsedUri.url).toEqual(item.expect); // Check if the sanitized URL matches the expected result
                        // Add more assertions if necessary
                  });


            }
  

});
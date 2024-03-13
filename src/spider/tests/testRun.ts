import axios from 'axios';
import { server } from "../../server"
import { ProcessOptions } from '../SpiderProcess';

server.on('listening', postDataToEndpoint);


 
// Define the data object you want to send

// Define the URL of your Express endpoint
const endpointUrl = 'http://localhost:3000/spider/initiate';

// Define an async function to make the POST request
async function postDataToEndpoint() {
      console.log("listening fired")
      try {
            // Make the POST request using axios

            const postData = new ProcessOptions();
            postData.maxPages = 10000
            postData.maxThreads = 20
            postData.batchId = "TestRun"
      //      postData.baseUrl = "https://hobbies.comparison.directory/en/"
      //      postData.baseUrl ="https://cms.comparison.directory/en/"
        //    postData.baseUrl = "https://musical-instruments.comparison.directory/en/"
          postData.baseUrl = "https://www.roadarch.com/roadside.html"
   //   postData.baseUrl = "https://g-mapper.co.uk"
  //     postData.baseUrl = "https://xmlsitemapplugin.org/en/"

            const response = await axios.post(endpointUrl, postData);

            // Log the response data
            console.log('Response:', response.data);
      } catch (error) {
            // Log any errors that occur
            console.error('TRIAL RUN ERROR ****************')
      //      console.log(error)
         //   console.error(error);
      }
}
 
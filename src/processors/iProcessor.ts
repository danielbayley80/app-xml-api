import { DataValue } from "src/data-store/DataService";


export interface iProcessor {
      name: string;
      fieldName: string;

      addFlag(page:DataValue) : void // used to set a database flag or value

      calculateProps(data:DataValue) : void // used to post process data on reading.

}
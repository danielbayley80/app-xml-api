import path from "path";
import dotenv from "dotenv";
import * as fs from 'fs';
 
// Augment the global namespace


declare global {
      interface GlobalSettings {
            configPath?: string;
            serverUrl?: string;

            NODE_ENV?: string;
            PORT?: string;
            HOME?: string;
            PATH?: string;
            USER?: string;
            LOGNAME?: string;
            TMPDIR?: string;
            TEMP?: string;
            HOSTNAME?: string;
            HOST?: string;
            SHELL?: string;
            LANG?: string;
            LC_ALL?: string;
      }
}
export {}

 
export class AppSettings implements GlobalSettings  {


      configPath: string;
      serverUrl : string; 

      constructor(configFile: string = ".env") {
            //super();
            const configPath = path.resolve(__dirname, `./../../${configFile}`);
            this.configPath = configPath;
              this.serverUrl = ""

            if (fs.existsSync(configPath)) {
                  console.log(`Config - Using path : %s`, configPath)
                  dotenv.config({ path: configPath });
            }
            else {
                  console.log(`Config - Path not found %s`, configPath)
            }

           try {

            // Iterate through the properties of process.env
            for (const key in process.env) {
                if (process.env.hasOwnProperty(key)) {
                    (this as any)[key] = process.env[key] || undefined;
                }
            }
            
           } catch (error) {
                   console.log("Config -  Error loading app config : %s", error);
            }
         
      }

      getProperty<K extends keyof GlobalSettings>(propertyName: K): GlobalSettings[K] {
            if (propertyName in this) {

                  const val = (this as any)[propertyName];

                  if (val === undefined || val === null) throw new Error(`Property '${propertyName}' is not defined.`);

                  return val;
            } else {
                  throw new Error(`Config - Property '${propertyName}' does not exist.`);
            }
      }

      // Optional: To allow property access using dot notation
      get<K extends keyof GlobalSettings>(propertyName: K): GlobalSettings[K] {
            return this.getProperty(propertyName);
      }


}


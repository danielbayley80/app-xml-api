import { AppSettings } from './../settings';
import fs from 'fs';

describe('Settings', () => {

      const settings = new AppSettings() as GlobalSettings

    it('should have a value for settings.sqliteFolder', () => {
    
        expect(settings.sqliteFolder).toBeDefined();
        expect(typeof settings.sqliteFolder).toBe('string'); // Assuming sqliteFolder is a string
    });

    it('the folder specified in settings.sqliteFolder should exist', () => {
      
        const folderPath = settings.sqliteFolder || "";
        expect(fs.existsSync(folderPath)).toBe(true);
    });
});
// Library imports
import yaml from 'js-yaml'
import fs from 'fs'

// Own Modules
import { Logger } from './logger';

/**
 *  Configuration module of the application
 */
export module Config {
    /**
     *  Holds configuration, access with [""]
     */
    export var get = {};

    /** 
     *  Function to read configuration from YAML-File
     *  @param path (string) path to YAML configuration file
     */
    export function setFromFile(path: string) {
        let filecontents = fs.readFileSync(path, 'utf-8');
        Config.get = yaml.load(filecontents);
        Logger.log("CONFIG", JSON.stringify(Config.get), Logger.LEVEL.INFO)
    }
}

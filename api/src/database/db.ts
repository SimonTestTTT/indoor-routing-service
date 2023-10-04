import { IDatabase } from "../interfaces";
import { Mongo } from "./mongo";

/** 
 * @description References to all available database interfaces 
 */
export module Databases {
    const knownDatabases = {
        "mongodb": Mongo
    }

    export let db: IDatabase

    export function init(dbname:string, dbconfig:any) {
        this.db = new knownDatabases[dbname](dbconfig)
    }
}
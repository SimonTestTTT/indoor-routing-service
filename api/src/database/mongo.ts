// Library imports
import { Model, Mongoose, Schema } from "mongoose";

// Own Modules
import { IPoI, IDatabase, EPoIType } from "../interfaces";
import { Logger } from "../logger";
import { Config } from "../config";

// Schemas
const poiSchema = new Schema<IPoI>({
    X: { type: Number, required: true },
    Y: { type: Number, required: true },
    Z: { type: Number, required: true },
    Type: { type: String, required: true },
    Name: { type: String, required: true },
    Description: { type: String, required: true },
    Trackable: { type: String, required: false }
})

/**
 * Implementation of Functions defined in IDatabase for mongodb
 */
export class Mongo implements IDatabase {
    private db: Mongoose
    private pois: Model<IPoI>

    constructor() {
        this.db = new Mongoose()
        this.pois = this.db.model<IPoI>('POI', poiSchema)
        this.db.connect("mongodb://" + Config.get["db"]["config"]["host"] + ":" +Config.get["db"]["config"]["port"] + "/").then(() => {
            Logger.log("MONGO_DB", "Connected to DB", Logger.LEVEL.INFO)
        }).catch(err => {
            Logger.log("MONGO_DB", err.message, Logger.LEVEL.ERROR)
        })

    }
    public addPOI(poi: IPoI) {
        return new Promise((resolve, reject) => {
            if (poi.Type == EPoIType.STATIC) {
                let poiModel = new this.pois(poi)
                poiModel.save().then((doc) => {
                    resolve(doc._id)
                }).catch((err) => {
                    reject(err)
                })
            }
            else {
                this.pois.find({ Trackable: poi.Trackable }, (err, results) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (results.length == 0) {
                        let poiModel = new this.pois(poi)
                        poiModel.save().then((doc) => {
                            resolve(doc._id)
                        }).catch((err) => {
                            reject(err)
                        })
                    }
                    else {
                        reject("Already exists")
                    }
                })
            }
        })
    }

    public getPOIs(): Promise<string[]> {
        let x = new Promise<string[]>((resolve, reject) => {
            this.pois.find((err, res) => {
                resolve(res.map(item => item._id.toString()))
            })
        })
        return x;
    }

    public getSinglePOI(id: string): Promise<IPoI> {
        return new Promise<IPoI>((resolve, reject) => {
            this.pois.findById(id, (err: NativeError, doc, res) => {
                if (err !== null) {
                    reject(err)
                }
                else if (doc === null) {
                    reject(undefined)
                }
                else
                    resolve(doc as IPoI)
            })
        })
    }

    public deleteSinglePOI(id: string): Promise<any> {
        return new Promise<IPoI>((resolve, reject) => {
            this.pois.findOneAndDelete({ _id: id }, (err: NativeError, doc, res) => {
                if (err !== null) {
                    reject(err)
                }
                else if (doc === null) {
                    reject(undefined)
                }
                else
                    resolve(doc as IPoI)
            })
        })
    }

    public updatePOI(id: string, update: object): Promise<any> {
        let x = new Promise<any>((resolve, reject) => {
            this.pois.findOneAndUpdate({ _id: id }, update, (err, doc, res) => {
                if (err !== null) {
                    reject(err)
                }
                else if (doc === null) {
                    reject(undefined)
                }
                else
                    resolve(doc as IPoI)
            })
        })
        return x
    }

    public updatePOIByTrackable(trackable: string, update:object):Promise<any> {
        let x = new Promise<any>((resolve, reject) => {
            this.pois.findOneAndUpdate({ Trackable: trackable }, update, (err, doc, res) => {
                if (err !== null) {
                    reject(err)
                }
                else if (doc === null) {
                    reject(undefined)
                }
                else
                    resolve(doc as IPoI)
            })
        })
        return x
    }
}
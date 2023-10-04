/** Enumeration for types of Points-iof-Interests */
export enum EPoIType {
    STATIC = "STATIC",
    OMLOX = "OMLOX"
}

/** Interface for Points-of-Interests */
export interface IPoI {
    X:number;
    Y:number;
    Z:number;
    Type:EPoIType;
    Name:string;
    Description:string;
    Trackable?:string;
}

/** Interface for databases, used for abstraction of database access */
export interface IDatabase {
    addPOI(poi:IPoI):Promise<any>;
    getPOIs():Promise<string[]>;
    getSinglePOI(id:string):Promise<IPoI>;
    deleteSinglePOI(id:string):Promise<any>;
    updatePOI(id:string, update: object):Promise<any>;
    updatePOIByTrackable(trackable: string, update:object):Promise<any>;
}

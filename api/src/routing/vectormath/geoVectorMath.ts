import {computeDestinationPoint, getGreatCircleBearing, getPreciseDistance} from "geolib"

// Own Modules
import { Vector2D } from "./vector"

/** Wrapper for Functions from geolib. Adapted to work with Vector2D class. */
export module geoVectorMath {
    export function distance(a:Vector2D, b:Vector2D)
    {
        return getPreciseDistance({lon: a.X, lat: a.Y}, {lon: b.X, lat: b.Y}, 0.05)
    }

    export function bearingPointtoPoint(a:Vector2D, b:Vector2D) {
        return getGreatCircleBearing({lon: a.X, lat: a.Y}, {lon: b.X, lat: b.Y}) / 360
    }

    export function moveOnEdge(a:Vector2D, distance:number, bearing:number) {
        let latlong = computeDestinationPoint({lon: a.X, lat: a.Y}, distance, bearing*360)
        return new Vector2D(latlong.longitude, latlong.latitude)
    }
}
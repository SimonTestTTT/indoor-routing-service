import { HubConnector } from "../hubConnector"
import { IPoI } from "../interfaces"
import { Logger } from "../logger"
import { Vector2D } from "./vectormath/vector"
import { geoVectorMath } from './vectormath/geoVectorMath'
import { Databases } from "../database/db"

/** Function for calculating the offset value */
function fit(input: { timestamp: string, alpha: number, positionAngle: number, distance: number }[]): { offset: number, factor: number } {
    let elements = []
    let sum = 0

    input.forEach(element => {
        // Calculate optimal offset for sensor measurement
        let offset = element.positionAngle - element.alpha
        if (Math.abs(offset) > 1 - Math.abs(offset) && offset < 0)
            offset = 1 - Math.abs(offset)
        if (Math.abs(offset) > 1 - Math.abs(offset) && offset > 0)
            offset = - (1 - Math.abs(offset))

        // Calculate weight of this offset in solution
        // Use sigmoid function
        let weight = 1 / (Math.pow(Math.E, - (5 * element.distance - 5)) + 1)

        // offset must be between -0.5 and 0.5
        // weight must be between 0 and 1
        sum = sum + weight
        elements.push({
            weight: weight,
            offset: offset
        })
    })

    console.log(JSON.stringify(elements))

    // Use circular mean, see https://en.wikipedia.org/wiki/Circular_mean
    let sinsum = 0
    let cossum = 0
    elements.forEach(element => {
        sinsum = sinsum + element.weight * Math.sin(element.offset * 2 * Math.PI)
        cossum = cossum + element.weight * Math.cos(element.offset * 2 * Math.PI)
    })

    sinsum = sinsum / sum
    cossum = cossum / sum

    let solution = Math.atan2(sinsum, cossum) / (2 * Math.PI)

    // Output
    Logger.log("OPTIMIZER_INPUT", JSON.stringify(input), Logger.LEVEL.INFO)
    Logger.log("OPTIMIZER_FOUND_OFFSET", solution.toString(), Logger.LEVEL.INFO)
    return { offset: solution, factor: 1 }
}

/** Holds one Routing Update, is a class because of compare Function. */
export class DirectionalUpdate {
    constructor(distance: number, angle: number, userBearing: number, pos: Vector2D, waiting = false) {
        this.distance = distance
        this.angle = angle
        this.position = pos
        this.userBearing = userBearing
        this.waiting = waiting
    }
    public distance: number
    public angle: number
    public position: Vector2D
    public userBearing: number
    public waiting: boolean
    public compare(b: DirectionalUpdate): boolean {
        if (this.distance === b.distance && this.angle === b.angle || (this.waiting && b.waiting))
            return true
        return false
    }
}

/** DirectionalRouting handles calculation of next DirectionalUpdate */
export class DirectionalRouting {
    lastUpdate: DirectionalUpdate
    lastpos: { position: Vector2D, timestamp: string }[] = []
    destId: string
    posId: string
    offset = NaN
    running = true
    lastorientationdata: { timestamp: string, alpha: number }
    collecteddata: { timestamp: string, alpha: number, positionAngle: number, distance: number }[]
    private cb: Function | undefined = undefined
    constructor(posId: string, destId: string) {
        this.destId = destId
        this.posId = posId
        this.lastUpdate = new DirectionalUpdate(0, 0, 0, new Vector2D(0, 0))
        this.collecteddata = []

        // Check for old location updates for sending waiting Update to client
        let startTimeChecking = () => {
            if (this.running) {
                if (this.lastpos.length > 0) {
                    let mostrecentPosition = this.lastpos[this.lastpos.length - 1]
                    if (new Date(mostrecentPosition.timestamp).getTime() < new Date().getTime() - 10000) {
                        // Update just contains waiting parameter
                        let update = new DirectionalUpdate(null, null, null, null, true)
                        if (!update.compare(this.lastUpdate)) {
                            this.lastUpdate = update
                            this.cb(update)
                        }
                    }
                }
                setTimeout(startTimeChecking, 500)
            }
        }
        startTimeChecking()

        // Wait for Location Updates from hub
        HubConnector.on(this.posId, (loc) => {
            if (this.running) {
                let currentPosition = new Vector2D(loc.position.coordinates[0], loc.position.coordinates[1])
                this.lastpos.push({ position: currentPosition, timestamp: loc.timestamp_generated })
                if (this.lastpos.length > 3) {
                    this.lastpos.shift()
                }

                Databases.db.getSinglePOI(this.destId).then((poi: IPoI) => {
                    try {
                        let mostrecentPosition = this.lastpos[this.lastpos.length - 1]
                        let destVector = new Vector2D()
                        destVector.X = poi.X
                        destVector.Y = poi.Y

                        let angles = this.getFinalBearing(mostrecentPosition.position, destVector)

                        let update = new DirectionalUpdate(geoVectorMath.distance(mostrecentPosition.position, destVector), angles.routingBearing, angles.userBearing, currentPosition)


                        if (!update.compare(this.lastUpdate)) {
                            this.lastUpdate = update
                            this.cb(update)
                        }

                    } catch (error) {
                        Logger.log("DIRECTIONAL_ROUTING", error.message, Logger.LEVEL.ERROR)
                    }
                }).catch((err) => {
                    Logger.log("DIRECTIONAL_ROUTING", err.message, Logger.LEVEL.ERROR)
                })
            }
        }, () => {
            return this.running
        })
    }


    public onRoutingUpdate(cb: Function | undefined) {
        this.cb = cb
    }

    public addOrientationSensorUpdate(data: { timestamp: string, alpha: number }) {
        this.lastorientationdata = {
            alpha: data.alpha / 360,
            timestamp: data.timestamp
        }
        if (this.running && this.offset !== NaN && this.lastpos.length > 0) {
            Logger.log("ORIENTATION_SENSOR", "got new orientation data " + JSON.stringify(this.lastorientationdata), Logger.LEVEL.INFO);
            Databases.db.getSinglePOI(this.destId).then((poi: IPoI) => {
                try {
                    let mostrecentPosition = this.lastpos[this.lastpos.length - 1]
                    if (new Date(mostrecentPosition.timestamp).getTime() < new Date().getTime() - 10000) {
                        let update = new DirectionalUpdate(null, null, null, null, true)
                        if (!update.compare(this.lastUpdate)) {
                            this.lastUpdate = update
                            this.cb(update)
                        }
                    }
                    else {
                        let destVector = new Vector2D()
                        destVector.X = poi.X
                        destVector.Y = poi.Y

                        let angles = this.getFinalBearing(mostrecentPosition.position, destVector, false)

                        let update = new DirectionalUpdate(geoVectorMath.distance(mostrecentPosition.position, destVector), angles.routingBearing, angles.userBearing, mostrecentPosition.position)
                        console.log(update)

                        if (!update.compare(this.lastUpdate)) {
                            this.lastUpdate = update
                            this.cb(update)
                        }
                    }

                } catch (error) {
                    Logger.log("DIRECTIONAL_ROUTING", error.message, Logger.LEVEL.ERROR)
                }
            }).catch((err) => {
                Logger.log("DIRECTIONAL_ROUTING", err.message, Logger.LEVEL.ERROR)
            })
        }
    }

    public stop() {
        this.running = false
    }

    /**
     * Calculate bearing angle based on both sources (positioning data and orientation sensor)
     * @param mostrecentPosition latest known position of user
     * @param destVector latest known position of destination
     * @param persist choose if you want to write the data the collecteddata list. default is true
     * @returns 
     */
    private getFinalBearing(mostrecentPosition: Vector2D, destVector: Vector2D, persist = true) {
        // Angle as estimated by the position data
        let directionAngle = geoVectorMath.bearingPointtoPoint(this.lastpos[0].position, mostrecentPosition)

        let postodestAngle = geoVectorMath.bearingPointtoPoint(mostrecentPosition, destVector)


        let movement = geoVectorMath.distance(this.lastpos[0].position, mostrecentPosition)
        // Angle measured by sensors
        if (this.lastorientationdata !== undefined) {
            Logger.log("LAST_ORIENTATION_DATA", JSON.stringify(this.lastorientationdata), Logger.LEVEL.INFO)
            if (persist) {
                this.collecteddata.push({
                    timestamp: new Date().toISOString(),
                    alpha: this.lastorientationdata.alpha,
                    positionAngle: directionAngle,
                    distance: movement
                })
            }

            // Sort the collecteddata by distance and therefore weight
            this.collecteddata.sort((a, b) => {
                return a.distance - b.distance
            })

            while (this.collecteddata.length > 50) {
                this.collecteddata.shift()
            }

            // Fusion
            let res = fit(this.collecteddata)
            if (res.offset !== NaN) {
                this.offset = res.offset
                directionAngle = this.lastorientationdata.alpha + res.offset
                Logger.log("BETTER_ANGLE", directionAngle.toString(), Logger.LEVEL.INFO)
            }
        }

        let finalangle = postodestAngle - directionAngle

        while (finalangle >= 1)
            finalangle = finalangle - 1
        while (finalangle < 0)
            finalangle = finalangle + 1

        while (directionAngle >= 1)
            directionAngle = directionAngle - 1
        while (directionAngle < 0)
            directionAngle = directionAngle + 1

        return { routingBearing: finalangle, userBearing: directionAngle }

    }
}
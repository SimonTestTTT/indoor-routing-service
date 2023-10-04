
import * as WebSocket from 'ws';


// Own Modules
import { Config } from "./config";
import { Databases } from "./database/db";
import { HubConnector } from "./hubConnector";
import { EPoIType } from "./interfaces";
import { Logger } from "./logger";

/**
 * @description Module used to update PoIs in the database
 */
export module PoIUpdater {
    /**
     * @description Function that starts updating service for PoIs
     */
    export function start() {
        let submsg = JSON.stringify({
          event: "subscribe",
          topic: "trackable_motions",
          params: {}
        })
        const ws = new WebSocket.WebSocket("ws://" + Config.get["omlox_hub"]["host"]
          + (Config.get["omlox_hub"]["port"] !== undefined ? ":" + Config.get["omlox_hub"]["port"] : "")
          + (Config.get["omlox_hub"]["path"] !== undefined ? Config.get["omlox_hub"]["path"] : "")
          + "/v1/ws/socket")
        ws.addListener('open', (code, reason) => {
          ws.send(submsg)
          Logger.log("POI_UPDATER", "WebSocket connection to omlox hub open", Logger.LEVEL.INFO)
        })
        ws.addListener('message', (msg) => {
          try {
            let obj = JSON.parse(msg.toString())
            if (obj.event == "message" && obj.topic == "trackable_motions") {
              obj.payload.forEach(update => {
                Databases.db.updatePOIByTrackable(update.id, {
                    X: update.location.position.coordinates[0],
                    Y: update.location.position.coordinates[1],
                    Z: update.location.position.coordinates[2]
                }).catch(err => {
                    if (err === undefined)
                    {
                        Databases.db.addPOI({
                            X: update.location.position.coordinates[0],
                            Y: update.location.position.coordinates[1],
                            Z: update.location.position.coordinates[2],
                            Type: EPoIType.OMLOX,
                            Description: "Imported from omlox hub",
                            Trackable: update.id,
                            Name: update.name
                        })
                    }
                })
              })
            }
          } catch (error) {
            Logger.log("POI_UPDATER", error.message, Logger.LEVEL.ERROR)
          }
        })
        ws.addListener('error', (error) => {
          Logger.log("POI_UPDATER", error.message, Logger.LEVEL.ERROR)
        })
        ws.addListener('close', (code, reason) => {
          ws.removeAllListeners()
          ws.terminate()
          Logger.log("POI_UPDATER", "WebSocket connection to omlox hub closed, restarting", Logger.LEVEL.WARNING)
          setTimeout(() => {
            PoIUpdater.start()
          }, 1000)
        })
    }
}

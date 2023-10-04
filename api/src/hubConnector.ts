// Library imports
import http from 'http'
import * as WebSocket from 'ws';

// Own Modules
import { Config } from "./config";
import { Logger } from "./logger";

/**
 * Module that handles all connections to the omlox hub
 */
export module HubConnector {
  const callbacks = {

  }

  /**
   * start subscription to location updates from omlox hub, uses WebSocket
   */
  export function wssubtolocs() {
    let submsg = JSON.stringify({
      event: "subscribe",
      topic: "location_updates",
      params: {}
    })
    const ws = new WebSocket.WebSocket("ws://" + Config.get["omlox_hub"]["host"]
      + (Config.get["omlox_hub"]["port"] !== undefined ? ":" + Config.get["omlox_hub"]["port"] : "")
      + (Config.get["omlox_hub"]["path"] !== undefined ? Config.get["omlox_hub"]["path"] : "")
      + "/v1/ws/socket")
    ws.addListener('open', (code, reason) => {
      ws.send(submsg)
      Logger.log("HUB_CONNECTION", "WebSocket connection to omlox hub open", Logger.LEVEL.INFO)
    })
    ws.addListener('message', (msg) => {
      try {
        let obj = JSON.parse(msg.toString())
        if (obj.event == "message" && obj.topic == "location_updates") {
          obj.payload.forEach(update => {

            Object.keys(callbacks).forEach(provider => {
              if (provider == update.provider_id) {
                callbacks[provider].forEach(cbobj => {
                  if (cbobj.checkifstillneeded())
                    cbobj.cb(update)
                })
              }
            })
          })
        }
        else 
        {
          Logger.log("HUB_CONNECTION", msg.toString(), Logger.LEVEL.INFO)
        }
      } catch (error) {
        Logger.log("HUB_CONNECTION", error.message, Logger.LEVEL.ERROR)
      }
    })
    ws.addListener('error', (error) => {
      Logger.log("HUB_CONNECTION", error.message, Logger.LEVEL.ERROR)
    })
    ws.addListener('close', (code, reason) => {
      ws.removeAllListeners()
      ws.terminate()
      Logger.log("HUB_CONNECTION", "WebSocket connection to omlox hub closed, restarting", Logger.LEVEL.WARNING)
      setTimeout(() => {
        HubConnector.wssubtolocs()
      }, 1000)
    })
  }

  /**
   * register a callback for a location provider
   * @param provider (string) id of location provider
   * @param cb (Function) to be called when new location update is available
   * @param checkifstillneeded (Function) called to check if cb should still be called when a location update is available
   */
  export function on(provider: string, cb: Function, checkifstillneeded: Function) {
    if (callbacks[provider] == undefined) {
      callbacks[provider] = []
    }
    callbacks[provider].push({ cb: cb, checkifstillneeded: checkifstillneeded })
  }
}

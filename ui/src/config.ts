import { LatLngExpression } from "leaflet"

import yaml from "yaml"

class Config {
    static get: {
        protocol: string,
        wsProtocol: string,
        wssPort: string,
        wsPort: string,
        baseAPIurl: string,
        colors: {
            graph: string,
            path: string,
            marker: string
        },
        mapCenter: LatLngExpression,
        tileServer: string
    }

    static loadConfig() {
        return new Promise((resolve, reject) => {
            fetch("/config/config.yaml").then((data) => {
                return data.text()

            }).then((text => {
                console.log(text)
                Config.get = yaml.parse(text)
                resolve(true)
            })).catch((err) => {
                console.log(err)
                reject(err)
            })
        })
    }

    static baseAPIurlws() {
        return Config.get["wsProtocol"] + "://" + window.location.hostname + (Config.get["wsPort"] !== undefined ? (":" + Config.get["wsPort"]) : "")
    }

    static setParams() {
        console.log(window.location.protocol)
        if (window.location.protocol === "https:") {
            console.log("Site loaded through https")
            Config.get["protocol"] = "https"
            Config.get["wsProtocol"] = "wss"
            Config.get["wsPort"] = Config.get["wssPort"]
        }
        console.log(Config.get["baseAPIurl"])
    }
}

export default Config
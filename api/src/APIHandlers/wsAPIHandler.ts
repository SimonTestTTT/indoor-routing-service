// Library imports
import { ObjectId } from 'mongoose';
import http from 'http'
import * as WebSocket from 'ws';
import { randomUUID } from 'crypto';

// Own Modules
import { DirectionalRouting, DirectionalUpdate } from '../routing/directional';
import { Logger } from '../logger';
import { GraphHelper, NavigationHint } from '../routing/graphHelper';
import { Config } from '../config';

export enum MessageTypes {
    REQUEST_ROUTING = "REQUEST_ROUTING",
    STOP_ROUTING = "STOP_ROUTING",
    ACCEPT_REQUEST = "ACCEPT",
    ROUTING_UPDATE = "ROUTING_UPDATE",
    NAVIGATION_HINT = "NAVIGATION_HINT",
    ERROR = "ERROR",
    ORIENTATION_SENSOR = "ORIENTATION_SENSOR"
}

export enum RoutingTypes {
    DIRECT = "DIRECT",
    TURNBYTURN = "TURNBYTURN"
}

type Routing = {
    type: RoutingTypes,
    ws: WebSocket.WebSocket,
    wsUUID: string,
    dest: string,
    pos: string,
    routingService: DirectionalRouting,
    graphRouting: GraphHelper.GraphRouting | undefined,
    id: string,
    routing_id: string
}

export module WSAPIHandler {
    const _routings = {}

    export function handle(baseString: string, server: http.Server) {
        const wss = new WebSocket.Server({ server: server, path: baseString + "/routing/ws" })
        wss.addListener('connection', (ws, req) => {
            handleMessages(ws)
        })
        wss.addListener('error', (err) => {
            Logger.log("WS_SERVER", err.message, Logger.LEVEL.ERROR)
        })
    }

    function handleMessages(ws: WebSocket.WebSocket) {
        const wsUUID = randomUUID()
        ws.addListener('message', (message: string) => {
            let id = "null"
            try {
                let msg = JSON.parse(message)
                Logger.log("WEBSOCKET", message, Logger.LEVEL.INFO)
                id = msg.id.toString()
                if (id == undefined) {
                    ws.send(JSON.stringify({ id: id, type: MessageTypes.ERROR, message: "Error: No 'id' specified" }))
                    return;
                }

                switch (msg.type) {
                    case MessageTypes.REQUEST_ROUTING:
                        let params = msg.params
                        if (params === undefined) {
                            ws.send(JSON.stringify({ id: id, type: MessageTypes.ERROR, message: "Error: No params specified" }))
                            return;
                        }
                        if (params.pos === undefined) {
                            ws.send(JSON.stringify({ id: id, type: MessageTypes.ERROR, message: "Error: No parameter 'pos' specified" }))
                            return;
                        }
                        if (params.dest === undefined) {
                            ws.send(JSON.stringify({ id: id, type: MessageTypes.ERROR, message: "Error: No parameter 'dest' specified" }))
                            return;
                        }
                        if (params.dest as ObjectId == null) {
                            ws.send(JSON.stringify({ id: id, type: MessageTypes.ERROR, message: "Error: 'dest' must be able to be cast to ObjectId" }))
                            return;
                        }
                        const routing: Routing = {
                            type: RoutingTypes.DIRECT,
                            ws: ws,
                            dest: params.dest,
                            pos: params.pos,
                            routingService: new DirectionalRouting(params.pos, params.dest),
                            graphRouting: undefined,
                            id: id,
                            routing_id: randomUUID(),
                            wsUUID: wsUUID
                        }

                        // Graph based routing
                        if (Config.get["graph"] !== undefined) {
                            routing.graphRouting = new GraphHelper.GraphRouting(routing.dest)
                            routing.graphRouting.onHintUpdate((hint: NavigationHint) => {
                                Logger.log("GRAPH_ROUTING", "New Navigation Hint: " + JSON.stringify(hint), Logger.LEVEL.INFO)
                                if (routing.ws.OPEN) {
                                    routing.ws.send(JSON.stringify({
                                        id: id,
                                        routing_id: routing.routing_id,
                                        type: MessageTypes.NAVIGATION_HINT,
                                        distance: hint.distance,
                                        movement: hint.movement,
                                        path: hint.path,
                                        bearing: hint.bearing
                                    }), (err) => {
                                        if (err !== undefined)
                                            Logger.log("GRAPH_ROUTING_UPDATE", err.message, Logger.LEVEL.ERROR)
                                    })
                                }
                            })
                        }


                        _routings[routing.routing_id] = routing
                        routing.routingService.onRoutingUpdate((update:DirectionalUpdate) => {
                            let msg = JSON.stringify({
                                id: routing.id,
                                routing_id: routing.routing_id,
                                type: MessageTypes.ROUTING_UPDATE,
                                update: update
                            })
                            Logger.log("ROUTING_UPDATE", msg, Logger.LEVEL.INFO)
                            if (routing.graphRouting !== undefined && !update.waiting) {
                                routing.graphRouting.update(update)
                            }

                            if (routing.ws.OPEN) {
                                routing.ws.send(msg, (err) => {
                                    if (err !== undefined)
                                        Logger.log("ROUTING_UPDATE", err.message, Logger.LEVEL.ERROR)
                                })
                            }
                        })

                        ws.send(JSON.stringify({ id: id, routing_id: routing.routing_id, type: MessageTypes.ACCEPT_REQUEST }))
                        break;
                    case MessageTypes.STOP_ROUTING:
                        _routings[msg.routing_id].routingService.stop()
                        _routings[msg.routing_id].graphRouting.stop()
                        if (_routings[msg.routing_id] === undefined) {
                            ws.send(JSON.stringify({ id: id, routing_id: msg.routing_id, type: MessageTypes.ERROR, message: "Error: No routing known with this routing_id" }))
                            return;
                        }
                        delete _routings[msg.routing_id]
                        break;
                    case MessageTypes.ORIENTATION_SENSOR:
                        if (_routings[msg.routing_id] !== undefined) {
                            _routings[msg.routing_id].routingService.addOrientationSensorUpdate({ alpha: msg.data.alpha, timestamp: msg.timestamp })
                        }
                        break;
                    default:
                        ws.send(JSON.stringify({ id: id, type: MessageTypes.ERROR, message: "Error: Unknown type" }))
                        break;
                }

            } catch (error) {
                ws.send(JSON.stringify({ id: id, type: MessageTypes.ERROR, message: error.toString() }))
            }

        })
        ws.addListener("close", (code, reason) => {
            Object.keys(_routings).forEach(routing_id => {
                if (_routings[routing_id].wsUUID == wsUUID) {
                    delete _routings[routing_id]
                }
            })
        })
    }

}

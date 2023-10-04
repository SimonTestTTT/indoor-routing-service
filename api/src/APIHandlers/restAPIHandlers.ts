// Library imports
import express from 'express';

// Own Modules
import { EPoIType, IDatabase, IPoI } from '../interfaces';
import { HubConnector } from '../hubConnector';
import { Logger } from '../logger';
import { Databases } from '../database/db';
import { Config } from '../config';
import { GraphHelper } from '../routing/graphHelper';

/**
 * Helper function for handling errors in REST API Calls
 * @param res Response the error is sent with
 * @param err Error should be undefined or have a message attribute
 * @param statusCode optional, status code that is sent with the response
 */
const handleErrors = function (res:any, err:any, statusCode:number = 404) {
    if (err !== undefined)
    {
        Logger.log("API", err.message, Logger.LEVEL.ERROR)
    }
    res.sendStatus(statusCode)
}

/**
 * Module that holds Handler for REST API Calls
 */
export module RESTAPIHandler {
    /**
     * Handler for REST API Caller
     * @param baseString (string) Added to the path of each endpoint, should start with a slash but not end with one
     * @param app (express Server) Express app
     */
    export function handle(baseString: string, app: express.Application) {
        // Point-of-Interest Management
        app.get(baseString + "/pois/:poi", (req, res) => {
            Databases.db.getSinglePOI(req.params.poi).then((poi) => {
                res.send(poi)
            }).catch((err) => {
                handleErrors(res, err)
            })
        })

        app.delete(baseString + "/pois/:poi", (req, res) => {
            Databases.db.deleteSinglePOI(req.params.poi).then((poi) => {
                res.send(poi)
            }).catch((err) => {
                handleErrors(res, err)
            })
        })

        app.put(baseString + "/pois/:poi", (req, res) => {
            Databases.db.updatePOI(req.params.poi, req.body).then((poi) => {
                res.send(poi)
            }).catch((err) => {
                handleErrors(res, err)
            })
        })

        app.get(baseString + "/pois", (req, res) => {
            Databases.db.getPOIs().then((pois: string[]) => {
                res.send(pois)
            }).catch((err) => {
                handleErrors(res, err)
            })
        })

        app.post(baseString + "/pois", (req, res) => {
            Databases.db.addPOI(req.body as IPoI).then((id: string) => {
                res.send(id)
            }).catch((err) => {
                handleErrors(res, err)
            })
        })

        // Graph Endpoints
        app.get(baseString + "/graph", (req, res) => {
            if (Config.get["graph"] !== undefined)
            {
                res.send(GraphHelper.graph.nodes)
            }
            else
            {
                res.send([])
            }
        })
        app.get(baseString + "/graph/edges", (req, res) => {
            if (Config.get["graph"] !== undefined)
            {
                let edges = []
                GraphHelper.graph.nodes.forEach(node => {
                    node.neighbours.forEach(neighbour => {
                        let neighbourNode = GraphHelper.graph.get(neighbour.id)

                        edges.push([
                            [
                                node.vector.Y,
                                node.vector.X
                            ],
                            [
                                neighbourNode.vector.Y,
                                neighbourNode.vector.X
                            ]
                        ])
                    })
                })
                res.send(edges)
            }
            else
            {
                res.send([])
            }
        })

    }
}

// Library imports
import fs from 'fs'
import { Databases } from '../database/db'
import { Logger } from '../logger'
import { DirectionalUpdate } from './directional'
import { geoVectorMath } from './vectormath/geoVectorMath'
import { Vector2D } from './vectormath/vector'

/**
 * Enum for different Types of Movement that could occur during Routing
 */
enum MovementTypes {
    Straight = "STRAIGHT",
    UTurn = "U_TURN",
    Left = "LEFT",
    Right = "RIGHT",
    DestinationReached = "DESTINATION_REACHED",
    Unavailable = "UNAVAILABLE"
}

/**
 * type that represents a hint for navigation
 */
export type NavigationHint = {
    movement: MovementTypes,
    distance: number,
    path: number[][],
    bearing: number
}

/**
 * Class that holds a graph and contains functionality to work with the graph
 */
class Graph {
    nodes: GraphHelper.Node[]

    get(id: number) {
        return this.nodes.find((a: GraphHelper.Node) => {
            return a.id === id
        })
    }
}

/**
 * Module for any Helper functions regarding graph based routing
 */
export module GraphHelper {

    /**
     * type that represents one Node in a Graph
     */
    export type Node = {
        vector: Vector2D
        neighbours: { id: number, g: number }[]
        id: number
    }

    // TODO: Think of a way to do online navigation, only recompute routing if user leaves the path. Update latest hint depending on users location updates
    /**
     * Class that does the actual routing and handles updates and "online" Navigation
     */
    export class GraphRouting {
        running = true
        lastUpdate: DirectionalUpdate
        cb: Function
        destinationPoI: string
        constructor(destinationPoI: string) {
            this.destinationPoI = destinationPoI
        }

        /**
         * Must be called for each new DirectionalUpdate that is available for this Routing Process
         * @param update (DirectionalUpdate) the new update
         */
        update(update: DirectionalUpdate) {
            this.lastUpdate = update
            if (this.running) {
                Databases.db.getSinglePOI(this.destinationPoI).then((poi) => {
                    this.cb(this.solve(update.position, update.userBearing, new Vector2D(poi.X, poi.Y)))
                })
            }
        }

        /**
         * Set the callback for updates on NavigationHints
         */
        onHintUpdate(cb: Function) {
            this.cb = cb
        }

        stop() {
            this.running = false
        }

        /**
         * Solve the current graph based on the position and the bearing of the user and the position of the destination
         */
        solve(position: Vector2D, bearing: number, destination: Vector2D): NavigationHint {
            let startEdge = findClosestEdge(position)
            let destinationEdge = findClosestEdge(destination)

            try {
                // Try all possibilities for Nodes to check for optimal solution
                Logger.log("PARAMS_A_STAR", "Start Behind: " + startEdge["0"], Logger.LEVEL.INFO)
                Logger.log("PARAMS_A_STAR", "Start Ahead: " + startEdge["1"], Logger.LEVEL.INFO)
                Logger.log("PARAMS_A_STAR", "Destination Behind: " + destinationEdge["0"], Logger.LEVEL.INFO)
                Logger.log("PARAMS_A_STAR", "Destination Ahead: " + destinationEdge["1"], Logger.LEVEL.INFO)

                // Try all possibilities for Nodes to check for optimal solution
                let solutions:{ path: Vector2D[], cost:number}[] = []
                solutions.push(AStar.solve(startEdge["0"], destinationEdge["0"]))
                solutions.push(AStar.solve(startEdge["0"], destinationEdge["1"]))
                solutions.push(AStar.solve(startEdge["1"], destinationEdge["0"]))
                solutions.push(AStar.solve(startEdge["1"], destinationEdge["1"]))
                
                solutions.forEach(solution => {
                    solution.cost = solution.cost + geoVectorMath.distance(position, startEdge.closestPoint)
                                                + geoVectorMath.distance(startEdge.closestPoint, solution.path[0])
                                                + geoVectorMath.distance(destinationEdge.closestPoint, destination)
                                                + geoVectorMath.distance(destinationEdge.closestPoint, solution.path[solution.path.length - 1])

                    solution.path.unshift(startEdge.closestPoint)
                    solution.path.unshift(position)
                    solution.path.push(destinationEdge.closestPoint)
                    solution.path.push(destination)
                })

                solutions.sort((a,b) => {
                    return a.cost - b.cost
                })

                let solution = solutions[0]

                let pathtoreturn:number[][] = []
                solution.path.map(node => {
                    pathtoreturn.push([node.Y, node.X])
                })
                if (solution.path.length > 2 && geoVectorMath.distance(position, destination) > 1) {
                    let distance = geoVectorMath.distance(solution.path[0], solution.path[1])
                    if (distance < 1.5)
                    {
                        distance = geoVectorMath.distance(solution.path[1], solution.path[2])
                    }
                    let targetBearing = geoVectorMath.bearingPointtoPoint(solution.path[1], solution.path[2])

                    // If the distance to the start Node is less than 3m show the direction the user has to go at the node
                    if (distance < 3)
                        targetBearing = geoVectorMath.bearingPointtoPoint(solution.path[2], solution.path[3])

                    let offset = targetBearing - bearing
                    if (Math.abs(offset) > 1 - Math.abs(offset) && offset < 0)
                        offset = 1 - Math.abs(offset)
                    if (Math.abs(offset) > 1 - Math.abs(offset) && offset > 0)
                        offset = - (1 - Math.abs(offset))
                    Logger.log("GRAPH_ROUTING_BEARINGS", "user: " + bearing + " edge: " + targetBearing + " offset: " + offset, Logger.LEVEL.WARNING)
                    let movementType = MovementTypes.Straight
                    if (distance > 3) {
                        if (offset > 0.25 || offset < -0.25) {
                            movementType = MovementTypes.UTurn
                        }
                        return {
                            movement: movementType,
                            distance: distance,
                            path: pathtoreturn,
                            bearing: bearing
                        }
                    }
                    else {
                        if (offset > 0.125 && offset < 0.275) {
                            movementType = MovementTypes.Right
                        }
                        else if (offset < -0.125 && offset > -0.275) {
                            movementType = MovementTypes.Left
                        }
                        else if (offset > 0.275 || offset < -0.275) {
                            movementType = MovementTypes.UTurn
                        }
                        return {
                            movement: movementType,
                            distance: distance,
                            path: pathtoreturn,
                            bearing: bearing
                        }
                    }
                }
                else {
                    return {
                        movement: MovementTypes.DestinationReached,
                        distance: geoVectorMath.distance(position, destination),
                        path: [[position.Y, position.X], [destination.Y, destination.X]],
                        bearing: bearing
                    }
                }
            } catch (error) {
                throw error
            }
        }

    }

    export var graph: Graph

    /**
     * Import Graph from file
     */
    export function read(path: string) {
        try {
            let filecontents = fs.readFileSync(path, 'utf-8');
            graph = new Graph()
            graph.nodes = JSON.parse(filecontents)
            Logger.log("GRAPH_HELPER", "Read graph: " + JSON.stringify(graph.nodes), Logger.LEVEL.INFO)
            // Compute Costs for all edges
            graph.nodes.forEach(node => {
                node.neighbours.forEach(neighbour => {
                    neighbour.g = geoVectorMath.distance(node.vector, graph.get(neighbour.id).vector)
                })
            })
            Logger.log("GRAPH_HELPER", "Updated graph with weights: " + JSON.stringify(graph.nodes), Logger.LEVEL.INFO)
        } catch (error) {
            Logger.log("GRAPH_HELPER", "Error while reading graph", Logger.LEVEL.ERROR)
            Logger.log("GRAPH_HELPER", error.message, Logger.LEVEL.ERROR)
            process.exit(1)
        }
    }

    /**
     * Find the point on the graph the user is nearest to
     * @param position (Vector2D) vector to find the closest Node to
     * @returns (number) id of the nearest Node
     */
    export function findClosestNode(position: Vector2D): number {
        let closest = graph.nodes[0].id
        let bestdistance = Number.MAX_SAFE_INTEGER

        graph.nodes.forEach(node => {
            let distance = geoVectorMath.distance(node.vector, position)
            if (distance < bestdistance) {
                bestdistance = distance
                closest = node.id
                console.log("Found better distance: " + bestdistance + " from node: " + closest)
            }
        })

        return closest
    }

    /** 
     * Returns the two Nodes that are connected through the edge
     * Recognizes which node is in front of the user and which is behind him
     * Navigation can then be done from the Node in front of the user
     * 
     * @param position (Vector2D) position of the user
     * @param bearing (number) current bearing of the user
     * @returns ({behind: number, ahead:number}) Node IDs for Node in front of and behind user
     */
    export function findClosestEdge(position: Vector2D): { 0: number, 1: number, distance: number, nodetoclosestDistance: number, closestPoint: Vector2D } {
        let closestEdge = {
            0: GraphHelper.graph.nodes[0].id,
            1: GraphHelper.graph.nodes[0].neighbours[0].id,
            distance: Number.MAX_SAFE_INTEGER,
            nodetoclosestDistance: 0,
            closestPoint: undefined
        }
        GraphHelper.graph.nodes.forEach((node: Node) => {
            node.neighbours.forEach(neighbour => {
                /** 
                 *   
                 * node--neighbour  
                 * |#2##/  
                 * |0#1/  
                 * |##/  
                 * |#/  
                 * |/  
                 * position  
                 * 
                 * Distances calculated in meters, because only short distances are expected, this is a good enough approximation   
                 * Angles will not be correct in this approximation, but this is not relevant for the calculation
                 * 
                 * Then take 0 as x Axis, this gives:  
                 * position = (len(1);0)    
                 * node = (0,0)  
                 * 
                */
                let distances = [
                    geoVectorMath.distance(position, GraphHelper.graph.get(node.id).vector),
                    geoVectorMath.distance(position, GraphHelper.graph.get(neighbour.id).vector),
                    geoVectorMath.distance(GraphHelper.graph.get(node.id).vector, GraphHelper.graph.get(neighbour.id).vector)
                ]

                /**
                 * Coordinates of neighbour:
                 * Special case is used, because centers of both circles are on the x Axis
                 * (see https://en.wikipedia.org/wiki/Intersection_(Euclidean_geometry)#Two_circles)
                 */
                /**
                 * x Coordinate of neighbour
                 * 
                 *       r1^2-r2^2+x2^2  
                 * x0 = ---------------  
                 *           2x2  
                 */
                let x0 = (distances[2] * distances[2] - distances[1] * distances[1] + distances[0] * distances[0]) / (2 * distances[0])

                /**
                 * y Coordinate of neighbour
                 * 
                 * y0 = sqrt(r1^2 - x0^2)
                 */
                let y0 = Math.sqrt(distances[2] * distances[2] - x0 * x0)

                if (y0 === NaN || x0 >= distances[2])
                    y0 = 0

                Logger.log("NEAREST_EDGE", "x0: " + x0 + " y0: " + y0, Logger.LEVEL.INFO)

                // Orthogonal Projection of point position on line node to neighbour
                // Simplification because line always goes through (0,0)
                // here * is the scalar product
                //
                //            position * [x0,y0]
                // factor = -------------------------
                //             [x0, y0] * [x0, y0]
                //
                // <==> factor = (position_x * x0 + position_y * y0) / (x0*x0 + y0*y0)
                // because position_y = 0 : 
                // <==> factor = (position_x * x0) / (x0*x0 + y0*y0) 
                let factor = (distances[0] * x0) / (x0 * x0 + y0 * y0)
                
                // closest Point on the line
                let closest = new Vector2D(factor * x0, factor * y0)

                // Restrict closest point on the line to the interval between the points
                if (factor > 1)
                    closest = new Vector2D(x0, y0)
                if (factor < 0)
                    closest = new Vector2D(0, 0)

                let distance = closest.distance(new Vector2D(distances[0], 0))

                Logger.log("DISTANCE_TO_EDGE", "Distance to " + node.id + " and " + neighbour.id + " is " + distance, Logger.LEVEL.INFO)

                if (distance < closestEdge.distance) {
                    closestEdge = {
                        0: node.id,
                        1: neighbour.id,
                        distance: distance,
                        nodetoclosestDistance: closest.distance(new Vector2D(0,0)),
                        closestPoint: undefined
                    }
                }
            })
        })
        let edgebearing = geoVectorMath.bearingPointtoPoint(GraphHelper.graph.get(closestEdge["0"]).vector, GraphHelper.graph.get(closestEdge["1"]).vector)
        closestEdge.closestPoint = geoVectorMath.moveOnEdge(GraphHelper.graph.get(closestEdge["0"]).vector,closestEdge.nodetoclosestDistance, edgebearing )
        console.log(closestEdge)
        return closestEdge
    }

}

/**
 * Implementation of A* Algorithm, see https://en.wikipedia.org/wiki/A*_search_algorithm
 */
module AStar {
    type ListEntry = {
        id: number,
        g: number,
        h: number,
        f: number,
        predecessor: number
    }

    /**
     * Cost function for A*
     */
    function h(input: GraphHelper.Node, destination: Vector2D): number {
        return geoVectorMath.distance(input.vector, destination)
    }

    /**
     * Helper Function to get Node from a list in A* implementation
     * @param id (string) id of the Node
     * @param list ({id: string}[]) where the Node should be searched for
     * @returns last element in list that has id == given id
     */
    export function getNodeFromList(id: number, list: ListEntry[]) {
        return list.find(element => {
            if (element.id == id)
                return true
        })
    }

    /**
     * Solves graph 
     * @param source (string) id of source node 
     * @param destination (string) id of destination node
     * @returns list of NavigationHints
     * @throws Error if no path is found from source to destination or the Nodes given can't be found in the graph
     */
    export function solve(source: number, destination: number) {
        const sourceNode = GraphHelper.graph.get(source)
        const destinationNode = GraphHelper.graph.get(destination)
        if (sourceNode !== undefined && destinationNode !== undefined) {
            let done = false
            let openList: ListEntry[] = []
            let closedList: ListEntry[] = []

            let sourceListElement: ListEntry = {
                f: 0,
                g: 0,
                predecessor: undefined,
                id: source,
                h: 0
            }

            openList.push(sourceListElement)

            while (openList.length > 0 && !done) {
                openList.sort((a, b) => {
                    return a.f - b.f
                })
                let current = openList.shift()
                if (current.id === destination) {
                    // Destination found
                    done = true
                    closedList.push(current)
                }
                else {
                    closedList.push(current)
                    _expandNode(GraphHelper.graph.get(current.id), openList, closedList, GraphHelper.graph.get(destination).vector)
                }
            }

            if (!done) {
                // Did not find a path
                throw new Error("Could not find path from source to destination")
            }
            else {
                // Found a path
                let path: Vector2D[] = []

                // Build a path starting at the destination and working through the predecessors
                // All Nodes that are part of the optimal path are in the closedList
                path.push(GraphHelper.graph.get(destination).vector)
                let lastAdded = getNodeFromList(destination, closedList)
                let cost = lastAdded.g
                while (lastAdded.predecessor !== undefined) {
                    path.push(GraphHelper.graph.get(lastAdded.id).vector)

                    lastAdded = getNodeFromList(lastAdded.predecessor, closedList)
                }
                path.push(GraphHelper.graph.get(lastAdded.id).vector)

                // Reverse graph because it is built starting at the destination
                path.reverse()
                Logger.log("A_STAR", "Found a path: " + JSON.stringify({ path: path, cost: cost }), Logger.LEVEL.INFO)

                return { path: path, cost: cost }
            }
        }
        else {
            throw new Error("Could not get source or destination Node from graph")
        }
    }

    /**
     * expand node, part of A* implementation
     * @param current 
     * @param openList 
     * @param closedList 
     */
    function _expandNode(current: GraphHelper.Node, openList: ListEntry[], closedList: ListEntry[], destination: Vector2D) {
        current.neighbours.forEach(neighbour => {
            // Only do something if node is not yet on the closed list
            if (getNodeFromList(neighbour.id, closedList) === undefined) {
                let g = getNodeFromList(current.id, closedList).g + neighbour.g

                // Skip if openlist already has neighbour with better path to it
                if (!(getNodeFromList(neighbour.id, openList) !== undefined && g >= (getNodeFromList(neighbour.id, openList).g))) {
                    let h_value = h(GraphHelper.graph.get(neighbour.id), destination)
                    let neighbourListElement: ListEntry = {
                        id: neighbour.id,
                        predecessor: current.id,
                        g: g,
                        f: g + h_value,
                        h: h_value
                    }
                    openList.push(neighbourListElement)
                }
            }
        })
    }
}


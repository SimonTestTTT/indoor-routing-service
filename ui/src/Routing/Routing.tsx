import React from "react"
import Direction from "./Direction"
import Distance from "./Distance"
import './styles/Routing.css'
import './styles/Distance.css'
import "../styles/general.css"
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import App from "../App"
import Config from "../config"
import NavigationHint, { IHint, MovementTypes } from "./NavigationHint"
import Settings from "../Settings/Settings"

export class RoutingData {
    static direction: Direction
    static distance: Distance
    static hint: NavigationHint
}

interface IProps {
    source: string,
    destination: string
}
interface IState {
    details: {
        name: string,
        description: string
    },
    navigationFocus: boolean
}

class Routing extends React.Component<IProps, IState> {
    private deviceorientationListener = (event: any) => {
        console.log(event)
        if (this.ws !== undefined && this.ws.OPEN) {
            if (this.lastOrientationEventSent + 500 < event.timeStamp) {
                this.lastOrientationEventSent = event.timeStamp
                let alpha = event.alpha
                if (Settings.values.flipSensor) {
                    alpha = 360 - alpha
                }
                console.log({
                    id: this.msg_id,
                    routing_id: this.routing_id,
                    type: "ORIENTATION_SENSOR",
                    data: {
                        alpha: alpha,
                        beta: event.beta,
                        gamma: event.gamma
                    },
                    timestamp: new Date().toISOString()
                })

                this.ws.send(JSON.stringify({
                    id: this.msg_id,
                    routing_id: this.routing_id,
                    type: "ORIENTATION_SENSOR",
                    data: {
                        alpha: alpha,
                        beta: event.beta,
                        gamma: event.gamma
                    },
                    timestamp: new Date().toISOString()
                }))
            }
        }
    }
    private lastOrientationEventSent = 0


    private updating: boolean = false
    private heading: number = NaN
    private distance: number = NaN
    private hint: IHint | undefined
    private waiting: boolean = true

    private source: string = ""
    private destination: string = ""
    private ws: WebSocket | undefined
    private routing_id: string = ""
    private msg_id: string = Math.round(Math.random() * 1000).toString()
    
    constructor(props: IProps) {
        super(props)
        const { source, destination } = props
        this.source = source
        this.destination = destination
        this.startUpdating()
        this.state = {
            details: {
                name: "",
                description: ""
            },
            navigationFocus: false
        }
        fetch(Config.get["baseAPIurl"] + "/api/v1/pois/" + this.props.destination, {
            headers: {
                'mode': 'no-cors'
            }
        }).then((response) => {
            response.json().then(json => {
                this.setState({
                    details: {
                        name: json.Name,
                        description: json.Description
                    }
                })
            })
        }).catch((err) => {
            console.log(err)
        })
        if (Settings.values.useSensor) {
            if (typeof (window.DeviceOrientationEvent as any) !== "undefined" &&  typeof (window.DeviceOrientationEvent as any).requestPermission === 'function') {
                console.log("Device is iOS 13+");
                (window.DeviceOrientationEvent as any).requestPermission()
                    .then((response: string) => {
                        console.log("Request Permission: ")
                        console.log(response)
                        if (response === 'granted') {
                            window.addEventListener('deviceorientation', this.deviceorientationListener)
                        }
                    })
                    .catch(console.error)
            } else {
                console.log("Not iOS")
                window.addEventListener("deviceorientation", this.deviceorientationListener)
            }
        }
    }

    componentWillUnmount() {
        console.log("Component will unmount")
        if (this.ws !== undefined) {
            this.ws.send(JSON.stringify({
                id: this.msg_id,
                routing_id: this.routing_id,
                type: "STOP_ROUTING"
            }))
            this.ws.close()
        }
        window.removeEventListener("deviceorientation", this.deviceorientationListener)
    }

    startUpdating() {
        if (!this.updating) {
            this.ws = new WebSocket(Config.baseAPIurlws() + "/api/v1/routing/ws")
            this.ws.onopen = () => {
                if (this.ws !== undefined) {
                    this.ws.send(JSON.stringify({
                        "id": this.msg_id,
                        "type": "REQUEST_ROUTING",
                        "params": {
                            "pos": this.source,
                            "dest": this.destination
                        }
                    }))
                }
            }

            this.ws.onmessage = (msg) => {
                const data = JSON.parse(msg.data)
                if (data.id === this.msg_id) {
                    if (data.type === "ROUTING_UPDATE") {
                        if (data.routing_id === this.routing_id && !data.update.waiting) {
                            this.heading = data.update.angle
                            this.distance = data.update.distance

                            console.log("Updating state of components")
                            console.log("heading:" + this.heading)
                            console.log("distance:" + this.distance)
                            RoutingData.direction.setState({
                                heading: this.heading,
                                distance: this.distance,
                                waiting: false
                            })
                            RoutingData.distance.setState({
                                heading: this.heading,
                                distance: this.distance,
                                waiting: false
                            })
                            this.waiting = false
                        }
                        else if (data.update.waiting)
                        {
                            RoutingData.direction.setState({
                                waiting: data.update.waiting
                            })
                            RoutingData.distance.setState({
                                waiting: data.update.waiting
                            })
                            RoutingData.hint.setState({
                                currentHint: { movement: MovementTypes.Unavailable, distance: 0, path: [], bearing: 0 }
                            })
                            this.waiting = true
                            this.setState({
                                navigationFocus: false
                            })
                        }
                    }
                    else if (data.type === "NAVIGATION_HINT") {
                        if (data.routing_id === this.routing_id) {
                            this.hint = {
                                distance: data.distance,
                                movement: data.movement,
                                path: data.path,
                                bearing: data.bearing
                            }
                            RoutingData.hint.setState({
                                currentHint: this.hint,
                                center: [((this.hint.path[0] !== undefined && this.hint.path[0].length === 2 ? this.hint.path[0][0] : 48.8183987)),
                                ((this.hint.path[0] !== undefined && this.hint.path[0].length === 2 ? this.hint.path[0][1] : 9.06556))],
                                destination: [((this.hint.path[this.hint.path.length - 1] !== undefined && this.hint.path[this.hint.path.length - 1].length === 2 ? this.hint.path[this.hint.path.length - 1][0] : 48.8183987)),
                                ((this.hint.path[this.hint.path.length - 1] !== undefined && this.hint.path[this.hint.path.length - 1].length === 2 ? this.hint.path[this.hint.path.length - 1][1] : 9.06556))]
                            })
                        }

                    }
                    else if (data.type === "ACCEPT") {
                        this.routing_id = data.routing_id
                    }
                }
            }
            this.updating = true
        }
    }

    render() {
        const DirectionProps = {
            heading: this.heading,
            distance: this.distance,
            waiting: this.waiting
        }
        const DistanceProps = {
            heading: this.heading,
            distance: this.distance,
            waiting: this.waiting
        }
        return (
            <div className="dark-background full-height flex-wrapper">
                <p className="title">{this.state.details.name}</p>
                {(this.state.navigationFocus ? <></> :
                    <>
                        <Direction {...DirectionProps}></Direction>
                        <Distance {...DistanceProps}></Distance>
                    </>
                )}
                {(this.state.navigationFocus ?
                    <NavigationHint
                        onClick={() => { }}
                        onClose={() => {
                            this.setState({
                                navigationFocus: false
                            })
                        }}
                        expanded={true} ></NavigationHint> : <></>)}
                <div className="center flex-wrapper footer">
                    <div style={{
                        flex: "auto"
                    }}></div>
                    {(!this.state.navigationFocus ?
                        <NavigationHint onClick={() => {
                            this.setState({
                                navigationFocus: true
                            })
                        }} expanded={false} ></NavigationHint> : <></>)}
                    <button onClick={() => {
                        if (App.currentRef !== undefined) {
                            App.currentRef.setState({
                                page: "DestinationSelection"
                            })
                        }
                    }} className="close">
                        <Icon
                            path={mdiClose}
                            size={2}
                            color="white"
                        />
                    </button>
                </div>
            </div>
        )
    }
}

export default Routing
import React from "react";

import { Marker } from "react-leaflet"
import App from "../App";
import { mdiMapMarker } from "@mdi/js"
import Icon from "@mdi/react";
import L from "leaflet";
import * as ReactDOMServer from 'react-dom/server';
import Config from "../config";

export default class POIMapMarkers extends React.Component<{ pois: string[] }, { pois: { X: number, Y: number, Name: string, Id: string }[] }> {
    running = true
    constructor(props: { pois: string[] }) {
        super(props)
        this.state = {
            pois: []
        }
    }

    componentDidMount() {
        let updatePOIs = () => {
            let temp:any[] = []
            this.props.pois.forEach(poi => {
                fetch(Config.get["baseAPIurl"] + "/api/v1/pois/" + poi, {
                    headers: {
                        'mode': 'no-cors'
                    }
                }).then((response) => {
                    response.json().then(json => {
                        temp.push({
                            X: json.X,
                            Y: json.Y,
                            Name: json.Name,
                            Id: json._id
                        })
                        if (this.props.pois.length === temp.length)
                            this.setState({ pois: temp })
                    })
                }).catch((err) => {
                    console.log(err)
                })
            })
            if (this !== undefined && this.running)
            {
                setTimeout(updatePOIs, 500)
            }
        }
        updatePOIs()
    }

    componentDidUpdate(prevProps: { pois: string[] }) {
        if (prevProps.pois.length !== this.props.pois.length) {
            this.props.pois.forEach(poi => {
                fetch(Config.get["baseAPIurl"] + "/api/v1/pois/" + poi, {
                    headers: {
                        'mode': 'no-cors'
                    }
                }).then((response) => {
                    response.json().then(json => {
                        let temp = this.state.pois
                        temp.push({
                            X: json.X,
                            Y: json.Y,
                            Name: json.Name,
                            Id: json._id
                        })
                        this.setState({ pois: temp })
                    })
                }).catch((err) => {
                    console.log(err)
                })
            })
        }
    }

    componentWillUnmount() {
        this.running = false
    }

    render() {
        return (
            <>
                {this.state.pois.map((poi, i) => {
                    return (<Marker position={[poi.Y, poi.X]} key={i} eventHandlers={{
                        click: () => {
                            if (App.currentRef !== undefined) {
                                App.destination = poi.Id
                                App.currentRef.setState({
                                    page: "Routing"
                                })
                            }
                        }
                    }} icon={new L.DivIcon({
                        html: ReactDOMServer.renderToString(
                            <>
                                <Icon path={mdiMapMarker} color={Config.get["colors"]["marker"]} size={2}></Icon>
                                <p className="text-bright" style={{ width: "48px", margin: "0", color: Config.get["colors"]["marker"] }}>{poi.Name}</p>
                            </>),
                        className: "",
                        iconAnchor: [24, 48]
                    })}>
                    </Marker>)
                })}
            </>
        )
    }
}
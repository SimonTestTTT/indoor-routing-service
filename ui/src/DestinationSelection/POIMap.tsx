import React from "react"
import "./styles/POIMap.css"

import { TileLayer, MapContainer, Polygon, Polyline } from 'react-leaflet'
import Config from "../config"
import POIMapMarkers from "./POIMapMarkers"

class POIMap extends React.Component<{}, { pois: string[], graph: any[] }>{

    constructor(props: any) {
        super(props)
        this.state = {
            pois: [],
            graph: []
        }
        let updatePOIs = () => {
            fetch(Config.get["baseAPIurl"] + "/api/v1/pois", {
                headers: {
                    'mode': 'no-cors'
                }
            }).then((response) => {
                response.json().then(json => {
                    console.log(json)
                    this.setState({
                        pois: json
                    })
                })
            }).catch((err) => {
                console.log(err)
            })
        }
        updatePOIs()

        fetch(Config.get["baseAPIurl"] + "/api/v1/graph/edges", {
            headers: {
                'mode': 'no-cors'
            }
        }).then((response) => {
            response.json().then((json) => {
                console.log(json)
                this.setState({
                    graph: json
                })
            })
        }).catch((err) => {
            console.log(err)
        })
    }


    render() {
        return (<div className="poi-map">
            <MapContainer center={Config.get["mapCenter"]} zoom={19} scrollWheelZoom={false} style={{ height: "100%" }}>
                <TileLayer
                    maxZoom={24}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={Config.get["tileServer"]}
                />
                <POIMapMarkers pois={this.state.pois}></POIMapMarkers>
                <Polyline positions={this.state.graph} color={Config.get["colors"]["graph"]}></Polyline>
            </MapContainer>
        </div>)
    }
}

export default POIMap
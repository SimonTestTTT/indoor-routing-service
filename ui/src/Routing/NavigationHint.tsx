import React, { createRef, MouseEventHandler } from "react";
import { mdiArrowLeftTopBold, mdiArrowRightTopBold, mdiArrowUDownLeftBold, mdiArrowUpBold, mdiArrowUpBoldCircleOutline, mdiArrowUpCircle, mdiArrowUpCircleOutline, mdiArrowUpDropCircle, mdiArrowUpThick, mdiChevronDown, mdiMapMarker, mdiMapMarkerCheck, mdiNavigation } from '@mdi/js';
import Icon from "@mdi/react";
import "./styles/NavigationHint.css"
import { RoutingData } from "./Routing";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import L, { LatLngExpression, Map } from "leaflet";
import ReactDOMServer from "react-dom/server";
import Config from "../config";

export interface IHint {
    distance: number,
    movement: MovementTypes,
    path: any[],
    bearing: number
}

export enum MovementTypes {
    Straight = "STRAIGHT",
    UTurn = "U_TURN",
    Left = "LEFT",
    Right = "RIGHT",
    DestinationReached = "DESTINATION_REACHED",
    Unavailable = "UNAVAILABLE"
}

interface IState {
    currentHint: IHint,
    center: LatLngExpression,
    destination: LatLngExpression
}


class NavigationHint extends React.Component<{ onClick: MouseEventHandler<HTMLDivElement>, onClose?: MouseEventHandler<HTMLDivElement>, expanded: boolean }, IState> {
    mapref = createRef<Map>()
    constructor(props: any) {
        super(props)
        this.state = {
            currentHint: { movement: MovementTypes.Unavailable, distance: 0, path: [], bearing: 0 },
            center: Config.get["mapCenter"],
            destination: Config.get["mapCenter"]
        }
        RoutingData.hint = this
    }

    render() {
        console.log(this.state.currentHint)
        if (this.mapref.current !== null)
        {
            // disable user interactions with map
            this.mapref.current?.dragging.disable();
            this.mapref.current?.touchZoom.disable();
            this.mapref.current?.doubleClickZoom.disable();
            this.mapref.current?.scrollWheelZoom.disable();
            this.mapref.current?.boxZoom.disable();
            this.mapref.current?.keyboard.disable();
            if (this.mapref.current?.tap) 
                this.mapref.current?.tap.disable();
            // Fly to current position
            this.mapref.current?.flyTo(this.state.center, 20)
        }

        return (<>{((this.state.currentHint !== undefined && this.state.currentHint.movement !== MovementTypes.Unavailable) || this.props.expanded ?
            <div className={(this.props.expanded ? "navigationHintExpanded" : "navigationHint") + " flex-wrapper"} onClick={this.props.onClick}>
                {(this.props.expanded ? <>
                <div onClick={this.props.onClose}>
                    <Icon
                        path={mdiChevronDown}
                        size={2}
                        color="white"
                    ></Icon>
                </div><div className="navigation-map">
                    <MapContainer center={this.state.center}
                        ref={this.mapref}
                        zoom={15}
                        scrollWheelZoom={false}
                        style={{ height: "100%" }}
                        zoomControl={false}>
                        <TileLayer
                            maxZoom={24}
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url={Config.get["tileServer"]}
                        />
                        <Polyline positions={this.state.currentHint.path} color={Config.get["colors"]["path"]}></Polyline>
                        <Marker position={this.state.center} 
                            icon={new L.DivIcon({
                                html: ReactDOMServer.renderToString(
                                    <>
                                        <Icon path={mdiNavigation} color="gray" size={1} rotate={this.state.currentHint.bearing * 360}></Icon>
                                    </>),
                                className: "",
                                iconAnchor: [12, 12]
                            })}>
                        </Marker>
                        <Marker position={this.state.destination} 
                            icon={new L.DivIcon({
                                html: ReactDOMServer.renderToString(
                                    <>
                                        <Icon path={mdiMapMarker} color={Config.get["colors"]["marker"]} size={2}></Icon>
                                        <p className="text-bright" style={{ width: "48px", margin: "0" }}>{""}</p>
                                    </>),
                                className: "",
                                iconAnchor: [24, 48]
                            })}>
                        </Marker>
                    </MapContainer>
                </div></> : <></>)}
                <div className="navigationHintInternalContainer">
                    <div className="flex-wrapper">
                        <div style={{
                            flex: "1 1 auto"
                        }}></div>
                        {(this.state.currentHint.movement === MovementTypes.Left ?
                            <Icon
                                path={mdiArrowLeftTopBold}
                                size={4}
                                color="white"
                            />
                            : (this.state.currentHint.movement === MovementTypes.Right ?
                                <Icon
                                    path={mdiArrowRightTopBold}
                                    size={4}
                                    color="white"
                                />
                                : (this.state.currentHint.movement === MovementTypes.Straight ?
                                    <Icon
                                        path={mdiArrowUpThick}
                                        size={4}
                                        color="white"
                                    />
                                    : (this.state.currentHint.movement === MovementTypes.UTurn ?
                                        <Icon
                                            path={mdiArrowUDownLeftBold}
                                            size={4}
                                            color="white"
                                        />
                                        : (this.state.currentHint.movement === MovementTypes.DestinationReached ?
                                            <Icon
                                                path={mdiMapMarkerCheck}
                                                size={4}
                                                color="white"
                                            />
                                            : <></>)))))}
                        <div style={{
                            flex: "1 1 auto"
                        }}></div>
                    </div>
                    <div className="hintTextContainer text flex-wrapper">
                        <div style={{
                            flex: "1 1 auto"
                        }}></div>
                        <h4 className="text-bright hintText">{(this.state.currentHint.movement === MovementTypes.Unavailable ? "-.-" : Math.round(this.state.currentHint.distance * 10) / 10)}m</h4>
                        <div style={{
                            flex: "1 1 auto"
                        }}></div>
                    </div>
                </div>
            </div> : <></>)}
        </>)
    }
}

export default NavigationHint
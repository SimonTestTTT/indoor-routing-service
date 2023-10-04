import React from "react";
import App from "../App";
import POIList from "./POIList";
import Icon from '@mdi/react';
import { mdiCog } from '@mdi/js';
import POIMap from "./POIMap";


export default class DestinationSelection extends React.Component {

    constructor(props: any) {
        super(props)
    }

    onStartRouting() {
    }

    render() {
        return (
            <div className="dark-background full-height flex-wrapper">
                <POIMap></POIMap>
                <POIList></POIList>
                <div className="center flex-wrapper footer">
                    <div style={{
                        flex: "auto"
                    }}></div>
                    <button onClick={() => {
                        if (App.currentRef !== undefined) {
                            App.currentRef.setState({
                                page: "Settings"
                            })
                        }
                    }} className="close">
                        <Icon
                            path={mdiCog}
                            size={2}
                            color="white"
                        />
                    </button>
                </div>
            </div>
        )
    }
}
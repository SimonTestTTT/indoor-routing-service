import React from "react";
import App from "../App";
import "../styles/general.css"
import "./styles/Settings.css"
import Icon from '@mdi/react';
import { mdiCheck, mdiClose } from '@mdi/js';
import { QrReader } from "react-qr-reader"
import { POIEditor } from "./POIEditor";


export default class Settings extends React.Component<{}, { ownTag: string, useSensor: boolean, flipSensor: boolean, qrCodeReadSuccessful: boolean }> {
    static values = {
        useSensor: true,
        navigation_source: "70B3:D50F:7030:0CFC",
        flipSensor: true
    }

    static loadValues() {
        let temp = localStorage.getItem("omlox_nav")
        if (temp !== null) {
            console.log(temp)
            Settings.values = JSON.parse(temp)
        }
        else {
            Settings.saveValues()
        }
    }

    static saveValues() {
        localStorage.setItem("omlox_nav", JSON.stringify(Settings.values))
    }

    constructor(props: any) {
        super(props)
        this.state = {
            ownTag: Settings.values.navigation_source,
            useSensor: Settings.values.useSensor,
            flipSensor: Settings.values.flipSensor,
            qrCodeReadSuccessful: false
        }
    }
    render() {
        let tempqrCodeReadSuccessful: boolean = this.state.qrCodeReadSuccessful
        if (tempqrCodeReadSuccessful) {
            setTimeout(() => {
                this.setState({
                    qrCodeReadSuccessful: false
                })
            }, 1000)
        }

        return (
            <div className="dark-background full-height flex-wrapper">
                <p className="title">Settings</p>
                <form className="scrollable">
                    <POIEditor className="settingsSection"></POIEditor>
                    <a className="title">Sensor Settings</a><br/>
                    <label className="text-bright">Own Location Provider</label><br />
                    <input id="ownTag" className="input-text" value={this.state.ownTag} onChange={(e) => {
                        this.setState({
                            ownTag: e.target.value
                        })
                        Settings.values.navigation_source = e.target.value
                        Settings.saveValues()
                    }}></input><br />
                    <label className="text-bright">Use Sensor for Orientation</label><br />
                    <input type={"checkbox"} id="useSensor" checked={this.state.useSensor} onChange={(event) => {
                        this.setState({
                            useSensor: event.target.checked
                        })
                        Settings.values.useSensor = event.target.checked
                        Settings.saveValues()
                    }}></input><br />
                    <label className="text-bright">Flip Sensor from clockwise to counter-clockwise</label><br />
                    <input type={"checkbox"} id="useSensor" checked={this.state.flipSensor} onChange={(event) => {
                        this.setState({
                            flipSensor: event.target.checked
                        })
                        Settings.values.flipSensor = event.target.checked
                        Settings.saveValues()
                    }}></input>
                    <div className="settingsSection">
                        <QrReader className="QRReader-container" constraints={{ facingMode: 'environment' }}
                            onResult={(result, error) => {
                                let macRegex = /^(?:[0-9A-Fa-f]{4}[:-]){3}(?:[0-9A-Fa-f]{4})$/
                                if (!!result) {
                                    console.log(result.getText())
                                    let mac = macRegex.exec(result.getText())
                                    console.log(mac);
                                    if (mac != null) {
                                        this.setState({
                                            ownTag: result.getText().toString(),
                                            qrCodeReadSuccessful: true
                                        })
                                        Settings.values.navigation_source = result.getText().toString()
                                        Settings.saveValues()
                                    }
                                }

                                if (!!error) {
                                }
                            }}
                            ViewFinder={() => {
                                return (tempqrCodeReadSuccessful ? <Icon
                                    path={mdiCheck}
                                    color={"white"}
                                    className={"QRReader-overlay"}
                                />
                                    : null)
                            }}
                        />
                    </div>
                </form>
                <div className="center flex-wrapper footer">
                    <div style={{
                        flex: "auto"
                    }}></div>
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
            </div>)
    }
}
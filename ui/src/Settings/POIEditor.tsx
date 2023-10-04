import { mdiContentSave, mdiPlus, mdiTrashCan } from "@mdi/js";
import Icon from "@mdi/react";
import React, { createRef } from "react";
import Config from "../config";
import "../styles/general.css"
import "./styles/POIEditor.css"

export class POIEditor extends React.Component<{ className: string }, { pois: any[], selected: string | undefined, selectedAdd: boolean }> {

    /**
     * Function to fetch all PoIs from the API
     */
    loadValues() {
        fetch(Config.get["baseAPIurl"] + "/api/v1/pois", {
            headers: {
                'mode': 'no-cors'
            }
        }).then((response) => {
            response.json().then((allpois: []) => {
                let temp: any[] = []
                allpois.forEach(poi => {
                    fetch(Config.get["baseAPIurl"] + "/api/v1/pois/" + poi, {
                        headers: {
                            'mode': 'no-cors'
                        }
                    }).then((response) => {
                        response.json().then(json => {
                            temp.push({
                                X: json.X,
                                Y: json.Y,
                                Z: json.Z,
                                Description: json.Description,
                                Name: json.Name,
                                Id: json._id,
                                Type: json.Type
                            })
                            if (allpois.length === temp.length)
                                this.setState({ pois: temp })
                        })
                    }).catch((err) => {
                        console.log(err)
                    })
                })
            })
        }).catch((err) => {
            console.log(err)
        })
    }

    constructor(props: any) {
        super(props)
        this.state = {
            pois: [],
            selected: undefined,
            selectedAdd: false
        }
        this.loadValues()
    }

    render() {
        // References for Input fields
        let Name_ref = createRef<HTMLInputElement>()
        let Description_ref = createRef<HTMLInputElement>()
        let X_ref = createRef<HTMLInputElement>()
        let Y_ref = createRef<HTMLInputElement>()
        let Z_ref = createRef<HTMLInputElement>()

        return (<div className={this.props.className}>
            <a className="title">Edit Points-of-Interest</a>
            <ul className="text-bright poi-editor-list">
                {this.state.pois.map((poi, i) => {
                    console.log(poi)
                    // Case for when this PoI is selected
                    if (poi.Id === this.state.selected) {
                        return (<li className="poi-editor-poi-selected">
                            <input ref={Name_ref} defaultValue={poi.Name}></input><br />
                            <input ref={Description_ref} defaultValue={poi.Description}></input><br />
                            {(poi.Type === "STATIC" ? <>
                                <input ref={X_ref} defaultValue={poi.X}></input><br />
                                <input ref={Y_ref} defaultValue={poi.Y}></input><br />
                                <input ref={Z_ref} defaultValue={poi.Z}></input><br />
                            </> : <></>)}
                            <ul className="buttons-horizontal">
                                <li style={{ width: "50%" }} onClick={() => {
                                    let update = poi
                                    update.Name = Name_ref.current?.value
                                    update.Description = Description_ref.current?.value
                                    if (poi.Type === "STATIC") {
                                        update.X = X_ref.current?.value
                                        update.Y = Y_ref.current?.value
                                        update.Z = Z_ref.current?.value
                                    }
                                    console.log(update)
                                    fetch(Config.get["baseAPIurl"] + "/api/v1/pois/" + poi.Id, {
                                        method: "PUT",
                                        body: JSON.stringify(update),
                                        headers: { 'Content-Type': 'application/json' }
                                    }).then(() => {
                                        this.setState({
                                            selected: undefined
                                        })
                                        this.loadValues()
                                    }).catch((err) => {
                                        console.log(err)
                                    })
                                }}>
                                    <Icon
                                        path={mdiContentSave}
                                        color={"white"}
                                        size={1}></Icon>
                                </li>
                                <li style={{ width: "50%" }} onClick={() => {
                                    fetch(Config.get["baseAPIurl"] + "/api/v1/pois/" + poi.Id, {
                                        method: "DELETE",
                                        headers: { 'Content-Type': 'application/json' }
                                    }).then(() => {
                                        this.setState({
                                            selected: undefined,
                                            selectedAdd: false
                                        })
                                        this.loadValues()
                                    }).catch((err) => {
                                        console.log(err)
                                    })
                                }}>
                                    <Icon
                                        path={mdiTrashCan}
                                        color={"white"}
                                        size={1}></Icon>
                                </li>
                            </ul>
                        </li>)
                    }
                    // Case for not selected PoIs
                    else {
                        return (<li className="poi-editor-poi" onClick={() => {
                            this.setState({
                                selected: poi.Id,
                                selectedAdd: false
                            })
                        }}>
                            <p className={"poi-editor-title"}>{poi.Name}</p>
                            <p className={"poi-editor-description"}>{poi.Description}</p>
                        </li>)
                    }
                })}
                {/* Section for adding new PoIs */}
                {(this.state.selectedAdd ? <li className="poi-editor-poi-selected">
                    <input ref={Name_ref} placeholder={"Name"}></input><br />
                    <input ref={Description_ref} placeholder={"Description"}></input><br />
                    <input ref={X_ref} placeholder={"X"}></input><br />
                    <input ref={Y_ref} placeholder={"Y"}></input><br />
                    <input ref={Z_ref} placeholder={"Z"}></input><br />
                    <ul className="buttons-horizontal" onClick={() => {
                        let poi = {
                            Name: Name_ref.current?.value,
                            Description: Description_ref.current?.value,
                            Type: "STATIC",
                            X: X_ref.current?.value,
                            Y: Y_ref.current?.value,
                            Z: Z_ref.current?.value
                        }
                        fetch(Config.get["baseAPIurl"] + "/api/v1/pois", {
                            method: "POST",
                            body: JSON.stringify(poi),
                            headers: { 'Content-Type': 'application/json' }
                        }).then(() => {
                            this.setState({
                                selected: undefined,
                                selectedAdd: false
                            })
                            this.loadValues()
                        }).catch((err) => {
                            console.log(err)
                        })
                    }}>
                        <li style={{width:"100%"}}>
                        <Icon
                            path={mdiPlus}
                            color={"white"}
                            size={1}></Icon></li>
                    </ul>
                </li>
                    : <li onClick={() => {
                        this.setState({ selectedAdd: true, selected: undefined })
                    }} className={"poi-editor-poi"}>
                        <Icon
                            path={mdiPlus}
                            color={"white"}
                            size={2}></Icon>
                    </li>)}
            </ul>
        </ div>)
    }
}
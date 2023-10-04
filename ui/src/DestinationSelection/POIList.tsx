import React from "react";
import POIListElement from "./POIListElement";
import "../styles/general.css"
import "./styles/POIList.css"
import Config from "../config";

interface IProps {

}

interface IState {
    pois: string[]
}


class POIList extends React.Component<IProps, IState> {
    constructor(props:any) {
        super(props)
        this.state = {
            pois: []
        }
        fetch(Config.get["baseAPIurl"] + "/api/v1/pois", {
            headers: {
                'mode': 'no-cors'
            }
        }).then((response) => {
            response.json().then(json => {
                this.setState({
                    pois: json
                })
            })
        }).catch((err) => {
            console.log(err)
        })
    }

    render() {
        return (
            <ul className="text-bright poi-list ">
                {this.state.pois.map((poi, i) => {
                    return (<POIListElement key={i} poi_id={poi}></POIListElement>)
                })}
            </ul>
        )
    }
}


export default POIList
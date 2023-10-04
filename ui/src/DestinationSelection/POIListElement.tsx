import React from "react"
import App from "../App"
import Config from "../config"
import "./styles/POIListElement.css"

interface IProps {
    poi_id:string
}

interface IState {
    details: {
        name: string,
        description:string
    }
}

class POIListElement extends React.Component<IProps, IState> {
    constructor(props:IProps) {
        super(props)
        this.state = {
            details: {
                name:"",
                description:""
            }
        }
        fetch(Config.get["baseAPIurl"] + "/api/v1/pois/" + this.props.poi_id, {
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
    }

    render() {
        return (
            <li className="poi" onClick={() => {
                if (App.currentRef !== undefined) {
                    App.destination = this.props.poi_id
                    App.currentRef.setState({
                        page: "Routing"
                    })
                }
                
            }}>
                <p className="poi-title">{this.state.details.name}</p>
                <p className="poi-description">{this.state.details.description}</p>
            </li>
        )
    }
}

export default POIListElement
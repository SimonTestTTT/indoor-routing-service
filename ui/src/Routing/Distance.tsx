import "./styles/Distance.css"
import React from "react"
import { RoutingData } from "./Routing"
import "../styles/general.css"

interface IProps {
    distance: number,
    heading: number,
    waiting: boolean
}
interface IState {
    distance: number,
    heading: number,
    waiting: boolean
}

export default class Distance extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props)
        const { distance, heading, waiting } = props
        RoutingData.distance = this
        this.state = {
            waiting: waiting,
            distance: distance,
            heading: heading
        }
    }

    render() {
        console.log(this.state)
        let heading = this.state.heading
        while (heading >= 1)
            heading = heading - 1
        while (heading < 0)
            heading = heading + 1
        let unit = "m"
        let distance = Math.round(this.state.distance * 10) / 10
        if (distance < 1) {
            unit = "cm"
            distance = Math.round(distance * 100)
        }
        else if (distance >= 1000 && distance < 10000) {
            unit = "km"
            distance = Math.round(distance / 10) / 100
        }
        else if (distance >= 10000 && distance < 50000) {
            unit = "km"
            distance = Math.round(distance / 100) / 10
        }
        else if (distance >= 50000) {
            unit = "km"
            distance = Math.round(distance / 1000)
        }


        let dir = ""
        let fillWords = ""

        if (isNaN(distance) || this.state.waiting) {
            fillWords = "waiting for location updates"
        }
        else if (heading < 0.1 || heading > 0.9) {
            dir = "straight ahead"
        }
        else if (heading > 0.1 && heading < 0.4) {
            fillWords = "to your"
            dir = "right"
        }
        else if (heading > 0.4 && heading < 0.6) {
            dir = "behind you"
        }
        else if (heading > 0.6 && heading < 0.9) {
            fillWords = "to your"
            dir = "left"
        }
        return (<div className="text">
            {isNaN(distance) || this.state.waiting ? <></> : <div className="text-bright">{distance}{unit}<br /></div>}
            <div className="text-muted">{fillWords}</div>
            <div className="text-bright">{dir}</div>
        </div>)
    }
}
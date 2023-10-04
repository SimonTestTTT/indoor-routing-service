import React, { PropsWithChildren } from 'react';
import Icon from '@mdi/react';
import { mdiArrowTopRight, mdiMapMarkerCheck, mdiMapMarkerQuestion } from '@mdi/js';
import './styles/Direction.css'
import { RoutingData } from './Routing';

export interface IProps {
    heading: number,
    distance: number,
    waiting: boolean
}
export interface IState {
    heading: number,
    distance: number,
    waiting: boolean
}

class Direction extends React.Component<IProps, IState> {

    constructor(props: PropsWithChildren<IProps>) {
        super(props)
        const { heading, distance, waiting, ...rest } = props
        this.state = {
            distance: distance,
            heading: heading,
            waiting: waiting
        }
        RoutingData.direction = this
    }

    render() {
        console.log(this.state)
        if (this.state.distance !== NaN && this.state.distance < 1) {
            return (<div className='arrow'>
                <Icon
                    path={mdiMapMarkerCheck}
                    size={10}
                    color="white"
                />
            </div>)
        }
        if (!isNaN(this.state.heading) && this.state.heading !== undefined && !this.state.waiting)
            return (
                <div className="arrow">
                    <Icon
                        path={mdiArrowTopRight}
                        size={10}
                        horizontal
                        vertical
                        rotate={Math.round(this.state.heading * 360) + 135}
                        color="white"
                    />
                </div>
            );
        else
            return (<div className='arrow'>
                <Icon
                    path={mdiMapMarkerQuestion}
                    size={10}
                    color="gray"
                />
            </div>)
    }
}

export default Direction;

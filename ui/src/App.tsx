import React from 'react';
import './App.css';
import Config from './config';
import DestinationSelection from './DestinationSelection/DestinationSelection';
import Routing from './Routing/Routing';
import Settings from './Settings/Settings';

interface IProps { }

interface IState {
  page: string,
  ready: boolean
}

/** Main React Component */
class App extends React.Component<IProps, IState> {
  static destination: string = ""
  static currentRef: App | undefined
  constructor(props: any) {
    super(props)
    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    let vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    // We listen to the resize event --> this is for adapting to changes in mobile browsers for search bars and so on
    window.addEventListener('resize', () => {
      // We execute the same script as before
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
    Config.loadConfig().then(()=> {
      Config.setParams()
      Settings.loadValues()
      this.setState({
        ready: true
      })
    })
    App.currentRef = this
    this.state = {
      page: "DestinationSelection",
      ready: false
    }
  }

  render() {
    if (!this.state.ready)
    {
      return (<></>)
    }
    if (this.state.page === "DestinationSelection") {
      return (
        <div className="App dark-background">

          <DestinationSelection></DestinationSelection>
        </div>
      );
    }
    else if (this.state.page === "Routing") {
      return (
        <div className="App dark-background">

          <Routing source={Settings.values.navigation_source} destination={App.destination}></Routing>
        </div>
      );
    }
    else if (this.state.page === "Settings") {
      return (<div className="App dark-background">

        <Settings></Settings>
      </div>)
    }
  }
}

export default App;

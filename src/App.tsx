import React from 'react';
import './App.css';
import {GatewayApiClient, RadixNetwork} from "@radixdlt/babylon-gateway-api-sdk";
import {TxsByMinutes} from "./components/charts/minutes/txsByMinutes";
import logo from "./radix_logo.png";

function App() {
  // Initialisation du client API Gateway
  const gatewayApi = GatewayApiClient.initialize({
    networkId: RadixNetwork.Mainnet,
    applicationName: 'Your dApp Name',
    applicationVersion: '1.0.0',
    applicationDappDefinitionAddress:
    process.env.ADDRESS,
  });


  return (
    <div className="App">
      <header>
        <img src={logo} alt="Radix Logo" className="logo"/>
        <h1 className={"title"}>Chartix</h1>
      </header>
      <div className={"main"}>
        {/*  <div className="menu">
          <label htmlFor="txsInterval">Select Interval: </label>
          <select id="txsInterval" className="dropdown" onChange={handleIntervalChange}>
            <option value="seconds">Txs By Seconds</option>
            <option value="minutes" selected>Txs By Minutes</option>
            <option value="hours">Txs By Hours</option>
          </select>
        </div>*/}

        <TxsByMinutes gatewayApi={gatewayApi}/>
      </div>

    </div>
  );
}

export default App;

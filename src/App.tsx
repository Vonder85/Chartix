import React, {useState} from 'react';
import './App.css';
import {GatewayApiClient, RadixNetwork} from "@radixdlt/babylon-gateway-api-sdk";
import {TxsByMinutes} from "./components/charts/txsByMinutes";
import logo from "./radix_logo.png";
import {TxsBySeconds} from "./components/charts/seconds/txsBySeconds";

function App() {
  // Initialisation du client API Gateway
  const gatewayApi = GatewayApiClient.initialize({
    networkId: RadixNetwork.Mainnet,
    applicationName: 'Your dApp Name',
    applicationVersion: '1.0.0',
    applicationDappDefinitionAddress:
    process.env.ADDRESS,
  });

  const [interval, setInterval] = useState("minutes");

  const handleIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInterval(event.target.value);
    console.log(`Selected interval: ${event.target.value}`);
    // Ici, mettez à jour les données en fonction de l'intervalle choisi
  };

  return (
    <div className="App">
      <header>
        <img src={logo} alt="Radix Logo" className="logo"/>
        <h1 className={"title"}>Chartix</h1>
      </header>
      <div className={"main"}>
        <div className="menu">
          <label htmlFor="txsInterval">Select Interval: </label>
          <select id="txsInterval" className="dropdown" onChange={handleIntervalChange}>
            <option value="seconds">Txs By Seconds</option>
            <option value="minutes" selected>Txs By Minutes</option>
            <option value="hours">Txs By Hours</option>
          </select>
        </div>
        {
          interval === "seconds" ?
            <TxsBySeconds gatewayApi={gatewayApi}/> : <TxsByMinutes gatewayApi={gatewayApi}/>
        }
      </div>

    </div>
  );
}

export default App;

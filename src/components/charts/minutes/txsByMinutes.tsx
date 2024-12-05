import React, {useEffect, useState} from 'react';
import {CommittedTransactionInfo, GatewayApiClient} from "@radixdlt/babylon-gateway-api-sdk";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

import styles from './txsByMinutes.module.scss'

interface TxsByMinutesProps {
  gatewayApi: GatewayApiClient
}

export const TxsByMinutes = ({gatewayApi}: TxsByMinutesProps) => {
  const [data, setData] = useState<{ time: string; count: number }[]>([]);
  const [transactionsByMinute, setTransactionsByMinute] = useState<Record<number, number>>({});
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const processTransactions = (transactions: CommittedTransactionInfo[]) => {
    const updatedTransactionsByMinute = {...transactionsByMinute};
    const newProcessedHashes = new Set(processedHashes);

    // Ajouter les transactions sans doublon
    transactions.forEach((tx) => {
      if (!newProcessedHashes.has(tx.intent_hash!)) {
        const timestamp = new Date(tx.round_timestamp).getTime();
        const minuteKey = Math.floor(timestamp / 60000);

        if (!updatedTransactionsByMinute[minuteKey]) {
          updatedTransactionsByMinute[minuteKey] = 0;
        }

        updatedTransactionsByMinute[minuteKey]++;
        newProcessedHashes.add(tx.intent_hash!);
      }
    });

    setTransactionsByMinute(updatedTransactionsByMinute);
    setProcessedHashes(newProcessedHashes);

    const currentTimestamp = Date.now();
    const thirtyMinutesAgo = Math.floor(currentTimestamp / 60000) - 30;

    const updatedData = Object.keys(updatedTransactionsByMinute)
      .sort((a, b) => Number(a) - Number(b))
      .filter((key) => Number(key) >= thirtyMinutesAgo)
      .map((key) => ({
        time: new Date(Number(key) * 60000).toLocaleTimeString(),
        count: updatedTransactionsByMinute[Number(key)],
      }));

    setData(updatedData);
  };

  useEffect(() => {
    if (data.length > 0) {
      setLoading(false)
    }
    const interval = setInterval(async () => {
      try {
        const response = await gatewayApi.stream.getTransactionsList();
        processTransactions(response.items);
      } catch (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
      }
    }, 5000);

    return () => clearInterval(interval); // Nettoyer l'intervalle à la fin du composant
  }, [transactionsByMinute, processedHashes, data.length, gatewayApi.stream, processTransactions]);

  return (
    <div className={styles.container}>
      <h2>Txs By Minutes</h2>
      {loading ? <div className="loading">Loading...</div> : <ResponsiveContainer>
        <AreaChart data={data} margin={{top: 10, right: 30, left: 0, bottom: 20}}
        >
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis dataKey="time" label={{value: 'Minutes', position: 'insideBottomRight', offset: -30}}/>
          <YAxis label={{value: 'Transactions', angle: -90, position: 'insideLeft'}}/>
          <Tooltip/>
          <Area type="monotone" dataKey="count" stroke="#8884d8" activeDot={{r: 8}}/>
        </AreaChart>
      </ResponsiveContainer>}

    </div>
  );
};
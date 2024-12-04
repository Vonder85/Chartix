import React, {useEffect, useState} from 'react';
import {CommittedTransactionInfo, GatewayApiClient} from "@radixdlt/babylon-gateway-api-sdk";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

import styles from "../minutes/txsByMinutes.module.scss";

interface TxsByHoursProps {
  gatewayApi: GatewayApiClient;
}

export const TxsByHours = ({gatewayApi}: TxsByHoursProps) => {
  const [data, setData] = useState<{ time: string; count: number }[]>([]); // Données pour le graphique
  const [transactionsByHour, setTransactionsByHour] = useState<Record<number, number>>({});
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set()); // Hashes déjà traités
  const [loading, setLoading] = useState(true); // État de chargement

  // Fonction pour regrouper les transactions par heure et éviter les doublons
  const processTransactions = (transactions: CommittedTransactionInfo[]) => {
    const updatedTransactionsByHour = {...transactionsByHour};
    const newProcessedHashes = new Set(processedHashes); // Copier les hashes existants pour mise à jour

    // Ajouter les transactions sans doublon
    transactions.forEach((tx) => {
      if (!newProcessedHashes.has(tx.intent_hash!)) {
        const timestamp = new Date(tx.round_timestamp).getTime();
        const hourKey = Math.floor(timestamp / (3600000)); // Regrouper par heure (1h = 3600000ms)

        if (!updatedTransactionsByHour[hourKey]) {
          updatedTransactionsByHour[hourKey] = 0;
        }

        updatedTransactionsByHour[hourKey]++;
        newProcessedHashes.add(tx.intent_hash!); // Marquer cette transaction comme traitée
      }
    });

    setTransactionsByHour(updatedTransactionsByHour);
    setProcessedHashes(newProcessedHashes); // Sauvegarder les hashes traités

    // Convertir pour le graphique
    const updatedData = Object.keys(updatedTransactionsByHour)
      .sort((a, b) => Number(a) - Number(b)) // Trier par heure
      .map((key) => ({
        time: new Date(Number(key) * 3600000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}), // Heure lisible
        count: updatedTransactionsByHour[Number(key)],
      }));

    setData(updatedData);
  };

  // Fonction pour récupérer les transactions toutes les 5 minutes
  useEffect(() => {
    if (data.length > 0) {
      setLoading(false)
    }

    const interval = setInterval(async () => {
      try {
        const response = await gatewayApi.stream.getTransactionsList();
        processTransactions(response.items);
      } catch (error) {
        console.error('Erreur lors de la récupération des transactions :', error);
      }
    }, 300000); // 5 minutes = 300000ms

    return () => clearInterval(interval); // Nettoyer l'intervalle à la fin du composant
  }, [transactionsByHour, processedHashes]);

  // Affichage du graphique
  return (
    <div className={styles.container}>
      <h2>Txs By Hours</h2>
      {loading ? <div className="loading">Loading...</div> :

        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="time" label={{value: 'Heures', position: 'insideBottomRight', offset: -5}}/>
            <YAxis label={{value: 'Transactions', angle: -90, position: 'insideLeft'}}/>
            <Tooltip/>
            <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{r: 8}}/>
          </LineChart>
        </ResponsiveContainer>}
    </div>
  );
};
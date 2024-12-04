import React, {useEffect, useState} from 'react';
import {CommittedTransactionInfo, GatewayApiClient} from "@radixdlt/babylon-gateway-api-sdk";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import styles from "../minutes/txsByMinutes.module.scss";

interface TxsBySecondsProps {
  gatewayApi: GatewayApiClient
}

export const TxsBySeconds = ({gatewayApi}: TxsBySecondsProps) => {
  const [data, setData] = useState<{ time: string; count: number }[]>([]); // Données pour le graphique
  const [transactionsBySecond, setTransactionsBySecond] = useState<Record<number, number>>({});
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set()); // Hashes déjà traités
  const [loading, setLoading] = useState(true); // État de chargement

  // Remplir les secondes manquantes avec des valeurs nulles (0 transaction)
  const fillMissingSeconds = (start: number, end: number, existingData: Record<number, number>) => {
    const filledData: Record<number, number> = {...existingData};

    for (let second = start; second <= end; second++) {
      if (!filledData[second]) {
        filledData[second] = 0; // Ajouter 0 si aucune transaction pour cette seconde
      }
    }

    return filledData;
  };

  // Fonction pour traiter les transactions et éviter les doublons
  const processTransactions = (transactions: CommittedTransactionInfo[]) => {
    const updatedTransactionsBySecond = {...transactionsBySecond};
    const newProcessedHashes = new Set(processedHashes); // Copie pour mettre à jour l'historique
    const currentTimestamp = Math.floor(Date.now() / 1000); // Temps actuel en secondes

    // Filtrer et ajouter les nouvelles transactions
    transactions.forEach((tx) => {
      if (!newProcessedHashes.has(tx.intent_hash!)) {
        const timestamp = Math.floor(new Date(tx.round_timestamp).getTime() / 1000);

        if (!updatedTransactionsBySecond[timestamp]) {
          updatedTransactionsBySecond[timestamp] = 0;
        }

        updatedTransactionsBySecond[timestamp]++;
        newProcessedHashes.add(tx.intent_hash!); // Marquer cette transaction comme traitée
      }
    });

    // Mettre à jour les transactions par seconde avec les secondes manquantes
    const filledTransactionsBySecond = fillMissingSeconds(
      currentTimestamp - 100, // Par exemple, afficher les 100 dernières secondes
      currentTimestamp,
      updatedTransactionsBySecond
    );

    setTransactionsBySecond(filledTransactionsBySecond);
    setProcessedHashes(newProcessedHashes); // Sauvegarder les hashes traités

    // Convertir pour le graphique (uniquement les multiples de 10 secondes)
    const updatedData = Object.keys(filledTransactionsBySecond)
      .filter((key) => Number(key) % 10 === 0) // Garde uniquement les multiples de 10 secondes
      .sort()
      .map((key) => ({
        time: new Date(Number(key) * 1000).toLocaleTimeString(), // Heure lisible
        count: filledTransactionsBySecond[Number(key)],
      }));

    setData(updatedData);
  };

  // Fonction pour récupérer les transactions toutes les 5 secondes
  useEffect(() => {
    if (data.length > 0) {
      setLoading(false)
    }
    const interval = setInterval(async () => {
      try {
        const response = await gatewayApi.stream.getTransactionsList();
        processTransactions(response.items);
      } catch (error) {
        console.error('Erreur lors de la récupération des transactions :', error);
      }
    }, 5000);

    return () => clearInterval(interval); // Nettoyer l'intervalle à la fin du composant
  }, [transactionsBySecond, processedHashes]);

  // Affichage du graphique
  return (
    <div className={styles.container}>
      <h2>Txs By Seconds</h2>
      {loading ? <div className="loading">Loading...</div> : <ResponsiveContainer>
        <AreaChart data={data} margin={{top: 10, right: 30, left: 0, bottom: 20}}
        >
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis dataKey="time" label={{value: 'Seconds', position: 'insideBottomRight', offset: -5}}/>
          <YAxis label={{value: 'Transactions', angle: -90, position: 'insideLeft'}}/>
          <Tooltip/>
          <Area type="monotone" dataKey="count" stroke="#8884d8" activeDot={{r: 8}}/>
        </AreaChart>
      </ResponsiveContainer>}
    </div>
  );
};

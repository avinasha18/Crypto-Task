import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [cryptos, setCryptos] = useState([]);
  const [avgPrice, setAvgPrice] = useState(0);
  const [inputValues, setInputValues] = useState({});
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCryptos();
    fetchTransactions();
  }, []);

  const fetchCryptos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/cryptos');
      setCryptos(response.data.cryptos);
      setAvgPrice(response.data.avgPrice);
    } catch (error) {
      console.error('Error fetching cryptos:', error);
      setError('Error fetching cryptocurrencies. Please try again later.');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/transactions');
      setTransactions(response.data.transactions);
      setHoldings(response.data.holdings);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Error fetching transactions. Please try again later.');
    }
  };

  const handleBuy = async (cryptoName) => {
    try {
      await axios.post('http://localhost:3000/api/buy', { cryptoName, amount: parseFloat(inputValues[cryptoName] || 0) });
      fetchCryptos();
      fetchTransactions();
      setInputValues((prev) => ({ ...prev, [cryptoName]: '' }));
    } catch (error) {
      console.error('Error buying crypto:', error);
      setError('Error executing buy transaction. Please try again later.');
    }
  };

  const handleSell = async (cryptoName) => {
    try {
      await axios.post('http://localhost:3000/api/sell', { cryptoName, amount: parseFloat(inputValues[cryptoName] || 0) });
      fetchCryptos();
      fetchTransactions();
      setInputValues((prev) => ({ ...prev, [cryptoName]: '' }));
    } catch (error) {
      console.error('Error selling crypto:', error);
      setError('Error executing sell transaction. Please try again later.');
    }
  };

  const handleInputChange = (cryptoName, value) => {
    setInputValues((prev) => ({ ...prev, [cryptoName]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center">Crypto Trading App</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <h2 className="text-3xl font-semibold mb-4">Current Cryptos</h2>
      <ul className="space-y-4">
        {cryptos.map((crypto) => (
          <li key={crypto.name} className="bg-gray-100 p-4 rounded-lg shadow-md flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xl font-semibold">{crypto.name}</span>
              <span>Last: {crypto.last}</span>
              <span>Buy: {crypto.buy}</span>
              <span>Sell: {crypto.sell}</span>
              <span>Volume: {crypto.volume}</span>
            </div>
            <div className="flex flex-col items-end">
              <input
                type="number"
                value={inputValues[crypto.name] || ''}
                onChange={(e) => handleInputChange(crypto.name, e.target.value)}
                placeholder="Amount"
                className="border p-2 rounded mb-2"
              />
              <button onClick={() => { setSelectedCrypto(crypto.name); handleBuy(crypto.name); }} className="bg-blue-500 text-white py-2 px-4 rounded mb-2">Buy</button>
              <button onClick={() => { setSelectedCrypto(crypto.name); handleSell(crypto.name); }} className="bg-red-500 text-white py-2 px-4 rounded">Sell</button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-3xl font-semibold mt-8 mb-4">Current Holdings</h2>
      <ul className="space-y-2">
        {holdings.map((holding) => (
          <li key={holding.crypto_name} className="bg-gray-200 p-3 rounded shadow-sm">
            {holding.crypto_name}: {holding.amount}
          </li>
        ))}
      </ul>

      <h2 className="text-3xl font-semibold mt-8 mb-4">Transactions</h2>
      <ul className="space-y-2">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="bg-gray-200 p-3 rounded shadow-sm">
            {transaction.crypto_name} - {transaction.transaction_type} - Amount: {transaction.amount} - Price: {transaction.price} - Time: {transaction.transaction_time}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

// src/components/Dashboard.js
import React from 'react';

const Dashboard = ({ holdings, onSell, balance }) => {
  return (
    <div className="border p-4 rounded shadow-md">
      <h2 className="text-xl font-bold mb-2">Your Holdings</h2>
      <p className="text-lg mb-4">Balance: ₹{parseFloat(balance).toFixed(2)}</p>
      <ul className="list-none">
        {holdings.length === 0 ? (
          <li>No holdings</li>
        ) : (
          holdings.map((stock, index) => (
            <li key={index} className="flex justify-between items-center py-2 border-b">
              <span>{stock.name.toUpperCase()} - ₹{parseFloat(stock.last).toFixed(2)}</span>
              <button
                onClick={() => onSell(stock.symbol)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Sell
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Dashboard;

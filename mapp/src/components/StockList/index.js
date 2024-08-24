// src/components/StockList.js
import React from 'react';

const StockList = ({ stocks, onBuy }) => {
  return (
    <div className="border p-4 rounded shadow-md">
      <h2 className="text-xl font-bold mb-2">Available Stocks</h2>
      <ul className="list-none">
        {stocks.map((stock, index) => (
          <li key={index} className="flex justify-between items-center py-2 border-b">
            <span>{stock.name.toUpperCase()} - ₹{parseFloat(stock.last).toFixed(2)}</span>
            <button
              onClick={() => onBuy(stock)}
              className="bg-green-500 text-white px-2 py-1 rounded"
            >
              Buy
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StockList;

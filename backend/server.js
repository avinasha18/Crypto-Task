const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const app = express();
const port = 3000;
const cors = require('cors')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crypto',
  password: 'postgres',
  port: 5432,
});
app.use(cors())
app.use(express.json()); 

const fetchData = async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Fetch new data
      const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
      const data = response.data;
      const top10 = Object.values(data).sort((a, b) => b.volume - a.volume).slice(0, 10);
  
      // Avoid deleting all records, instead update or insert
      const insertQuery = `
        INSERT INTO crypto_data (name, last, buy, sell, volume, base_unit) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        ON CONFLICT (name) 
        DO UPDATE SET 
          last = EXCLUDED.last, 
          buy = EXCLUDED.buy, 
          sell = EXCLUDED.sell, 
          volume = EXCLUDED.volume, 
          base_unit = EXCLUDED.base_unit
      `;
  
      for (const crypto of top10) {
        await client.query(insertQuery, [crypto.name, crypto.last, crypto.buy, crypto.sell, crypto.volume, crypto.base_unit]);
      }
  
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error fetching data:', error);
    } finally {
      client.release();
    }
  };
  
fetchData();
setInterval(fetchData, 60000); 

app.get('/api/cryptos', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM crypto_data');
    const cryptos = result.rows;

    const avgPrice = (cryptos.reduce((sum, crypto) => sum + parseFloat(crypto.last), 0) / cryptos.length).toFixed(2);

    res.json({ cryptos, avgPrice });
    client.release();
  } catch (error) {
    console.error('Error fetching cryptos:', error);
    res.status(500).send('Server error');
  }
});

app.post('/api/buy', async (req, res) => {
    const { cryptoName, amount } = req.body;
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM crypto_data WHERE name = $1', [cryptoName]);
      const crypto = result.rows[0];
  
      if (!crypto) {
        res.status(404).send('Cryptocurrency not found');
        client.release();
        return;
      }
  
      const totalCost = crypto.buy * amount;
  
      await client.query(
        'INSERT INTO user_transactions (crypto_name, transaction_type, amount, price) VALUES ($1, $2, $3, $4)',
        [cryptoName, 'buy', amount, totalCost]
      );
  
      const holdingResult = await client.query(
        'INSERT INTO user_holdings (crypto_name, amount) VALUES ($1, $2) ON CONFLICT (crypto_name) DO UPDATE SET amount = user_holdings.amount + EXCLUDED.amount RETURNING amount',
        [cryptoName, amount]
      );
  
      const updatedAmount = holdingResult.rows[0].amount;
  
      client.release();
      res.json({ message: 'Buy transaction successful', totalCost, updatedAmount });
    } catch (error) {
      console.error('Error in buy transaction:', error);
      res.status(500).send('Server error');
    }
  });
  

app.post('/api/sell', async (req, res) => {
  const { cryptoName, amount } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM crypto_data WHERE name = $1', [cryptoName]);
    const crypto = result.rows[0];

    if (!crypto) {
      res.status(404).send('Cryptocurrency not found');
      return;
    }

    const totalRevenue = crypto.sell * amount;

    await client.query(
      'INSERT INTO user_transactions (crypto_name, transaction_type, amount, price) VALUES ($1, $2, $3, $4)',
      [cryptoName, 'sell', amount, totalRevenue]
    );

    const holdingResult = await client.query(
      'UPDATE user_holdings SET amount = amount - $2 WHERE crypto_name = $1 RETURNING amount',
      [cryptoName, amount]
    );

    if (holdingResult.rowCount === 0) {
      res.status(404).send('Not enough holdings');
      return;
    }

    const updatedAmount = holdingResult.rows[0].amount;

    client.release();
    res.json({ message: 'Sell transaction successful', totalRevenue, updatedAmount });
  } catch (error) {
    console.error('Error in sell transaction:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM user_transactions ORDER BY transaction_time DESC');
    const transactions = result.rows;

    const holdingsResult = await client.query(`
      SELECT crypto_name, amount
      FROM user_holdings
    `);

    const holdings = holdingsResult.rows;

    client.release();
    res.json({ transactions, holdings });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

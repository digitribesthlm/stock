import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

export default async function handler(req, res) {
  const { ticker } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);

  try {
    const stock = await db
      .collection('stock')
      .findOne({ ticker: ticker.toUpperCase() });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.status(200).json(stock);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
} 
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);

  try {
    const stocks = await db
      .collection('stock')
      .find({}, { projection: { ticker: 1, company: 1 } })
      .toArray();

    res.status(200).json(stocks);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
} 
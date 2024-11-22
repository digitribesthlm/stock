import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const stocksCollection = db.collection('stock');
    
    const stocks = await stocksCollection.find({}).toArray();
    
    if (!stocks || stocks.length === 0) {
      return res.status(404).json({ message: 'No stock data found' });
    }
    
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch stock data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('stock_disruption_analysis');
    const { ticker } = req.query;

    if (!ticker) {
      return res.status(400).json({ message: 'Ticker is required' });
    }

    const analysis = await collection.findOne({ ticker });
    return res.status(200).json(analysis || null);
  } catch (error) {
    console.error('Get analysis error:', error);
    return res.status(500).json({ error: error.message });
  }
}

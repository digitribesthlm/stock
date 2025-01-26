import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    console.log('Connected to database');

    const analyses = await db.collection('stock_disruption_analysis')
      .find({})
      .sort({ analysisDate: -1 })
      .toArray();
    
    console.log('Found analyses:', analyses.length);
    
    return res.status(200).json(analyses);
  } catch (error) {
    console.error('Error fetching disruption analyses:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch disruption analyses',
      error: error.toString()
    });
  }
}

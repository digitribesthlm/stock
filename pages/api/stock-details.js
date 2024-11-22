import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  console.log('Stock Details API Endpoint Called'); // Logging start of request

  if (req.method !== 'GET') {
    console.log('Method not allowed'); // Log method check
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Attempting to connect to database'); // Log database connection attempt
    const { db, client } = await connectToDatabase();
    console.log('Database connection successful'); // Log successful connection

    console.log('Attempting to access stock collection'); // Log collection access attempt
    const stocksCollection = db.collection('stock');
    console.log('Stock collection accessed successfully'); // Log successful collection access

    console.log('Attempting to find stocks'); // Log find operation start
    const stocks = await stocksCollection.find({}).toArray();
    console.log('Find operation completed', stocks.length); // Log number of stocks found

    if (!stocks || stocks.length === 0) {
      console.log('No stocks found'); // Log empty result
      return res.status(404).json({ message: 'No stock data found' });
    }
    
    // Log first stock as a sample
    console.log('First stock sample:', stocks[0]);
    
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Detailed Database Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    res.status(500).json({ 
      message: 'Failed to fetch stock data',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
}

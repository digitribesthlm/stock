import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  // Set CORS headers to prevent any potential CORS issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log('Stock Details API Endpoint Called');

  if (req.method !== 'GET') {
    console.log('Method not allowed');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Attempting to connect to database');
    const { db, client } = await connectToDatabase();
    
    if (!db) {
      console.error('Database connection failed - db object is undefined');
      throw new Error('Database connection failed');
    }
    
    console.log('Database connection successful');

    console.log('Attempting to access stock collection');
    const stocksCollection = db.collection('stock');
    
    if (!stocksCollection) {
      console.error('Stock collection access failed - collection is undefined');
      throw new Error('Failed to access stock collection');
    }
    
    console.log('Stock collection accessed successfully');

    console.log('Attempting to find stocks');
    const stocks = await stocksCollection.find({}).toArray();
    
    if (!stocks) {
      console.error('Find operation failed - result is undefined');
      throw new Error('Failed to retrieve stocks from database');
    }
    
    console.log(`Found ${stocks.length} stocks`);

    if (stocks.length === 0) {
      console.log('No stocks found in database');
      return res.status(200).json([]); // Return empty array instead of 404
    }

    // Validate that we have valid JSON data
    try {
      JSON.stringify(stocks);
    } catch (jsonError) {
      console.error('JSON serialization failed:', jsonError);
      throw new Error('Failed to serialize stock data');
    }

    // Set proper content type
    res.setHeader('Content-Type', 'application/json');
    
    // Send response
    return res.status(200).json(stocks);
    
  } catch (error) {
    console.error('Detailed Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    // Send a more detailed error response
    return res.status(500).json({ 
      message: 'Failed to fetch stock data',
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        cause: error.cause
      } : 'Internal server error'
    });
  }
}

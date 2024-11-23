import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log('Update Stock Status API Endpoint Called');

  if (req.method !== 'PUT') {
    console.log('Method not allowed');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { stockId, status } = req.body;
  console.log('Received update request:', { stockId, status });

  if (!stockId || !status) {
    console.log('Missing required fields:', { stockId, status });
    return res.status(400).json({ message: 'Stock ID and status are required' });
  }

  try {
    console.log('Attempting to connect to database');
    const { db } = await connectToDatabase();
    
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

    // Handle both string ID and object with $oid
    let objectId;
    try {
      objectId = new ObjectId(typeof stockId === 'object' ? stockId.$oid : stockId);
    } catch (error) {
      console.error('Invalid ObjectId format:', stockId);
      return res.status(400).json({ message: 'Invalid stock ID format' });
    }
    console.log('Converted ObjectId:', objectId.toString());

    // First, verify the stock exists
    const existingStock = await stocksCollection.findOne({ _id: objectId });
    if (!existingStock) {
      console.log('Stock not found:', stockId);
      return res.status(404).json({ message: 'Stock not found' });
    }
    console.log('Found existing stock:', {
      id: existingStock._id.toString(),
      currentStatus: existingStock.metadata?.status
    });

    const now = new Date();
    // Perform the update
    console.log('Attempting to update stock status');
    const updateResult = await stocksCollection.updateOne(
      { _id: objectId },
      { 
        $set: { 
          'metadata.status': status,
          'metadata.lastUpdated': now
        } 
      }
    );

    console.log('Update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      upsertedCount: updateResult.upsertedCount
    });

    if (updateResult.matchedCount === 0) {
      console.log('No document matched the ID');
      return res.status(404).json({ message: 'Stock not found' });
    }

    if (updateResult.modifiedCount === 0 && existingStock.metadata?.status === status) {
      console.log('Document found but not modified (same status)');
      return res.status(200).json({ 
        message: 'Stock status unchanged',
        stock: {
          id: objectId.toString(),
          status: status,
          lastUpdated: existingStock.metadata?.lastUpdated
        }
      });
    }

    if (updateResult.modifiedCount === 0) {
      console.log('Document found but not modified (unknown reason)');
      return res.status(400).json({ message: 'Stock status not modified' });
    }

    // Verify the update
    const updatedStock = await stocksCollection.findOne({ _id: objectId });
    console.log('Verified updated stock:', {
      id: updatedStock._id.toString(),
      status: updatedStock.metadata?.status,
      lastUpdated: updatedStock.metadata?.lastUpdated
    });

    console.log('Successfully updated stock status');
    return res.status(200).json({ 
      message: 'Stock status updated successfully',
      stock: {
        id: updatedStock._id.toString(),
        status: updatedStock.metadata?.status,
        lastUpdated: updatedStock.metadata?.lastUpdated
      }
    });
  } catch (error) {
    console.error('Detailed Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    return res.status(500).json({ 
      message: 'Failed to update stock status',
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        cause: error.cause
      } : 'Internal server error'
    });
  }
}

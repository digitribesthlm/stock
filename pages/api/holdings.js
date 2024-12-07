import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

export default async function handler(req, res) {
  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);

  try {
    switch (req.method) {
      case 'GET':
        // Get user's holdings (you'll need to add auth/user context later)
        const holdings = await db
          .collection('stock_holdings')
          .find({ status: 'ACTIVE' })
          .toArray();
        
        res.status(200).json(holdings);
        break;

      case 'POST':
        const {
          symbol,
          quantity,
          averageEntryPrice,
          currentAnalysis,
          transactions
        } = req.body;

        // Create new holding document
        const newHolding = {
          userId: new ObjectId("6728ba02768b0bc95ccadbc7"), // Hardcoded for now, replace with actual user ID
          symbol,
          quantity,
          averageEntryPrice,
          currentValue: quantity * averageEntryPrice,
          transactions,
          currentAnalysis: {
            ...currentAnalysis,
            lastUpdated: new Date()
          },
          valueHistory: [{
            date: new Date(),
            value: quantity * averageEntryPrice,
            pricePerShare: averageEntryPrice
          }],
          status: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = await db
          .collection('stock_holdings')
          .insertOne(newHolding);

        res.status(201).json(result);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
}
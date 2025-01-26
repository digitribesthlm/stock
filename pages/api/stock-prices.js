import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const { tickers } = req.query;

    if (!tickers) {
      return res.status(400).json({ message: 'Tickers parameter is required' });
    }

    const tickerList = tickers.split(',');
    const stockPrices = await db.collection('stocks').find({
      ticker: { $in: tickerList }
    }).toArray();

    // Convert array to object with ticker as key
    const priceMap = {};
    stockPrices.forEach(stock => {
      const prices = stock.historicalPrices || [];
      if (prices.length > 0) {
        const currentPrice = prices[prices.length - 1].close;
        const price30dAgo = prices.find(p => {
          const date = new Date(p.date);
          const daysAgo = (new Date() - date) / (1000 * 60 * 60 * 24);
          return daysAgo >= 30 && daysAgo < 31;
        })?.close;
        const price60dAgo = prices.find(p => {
          const date = new Date(p.date);
          const daysAgo = (new Date() - date) / (1000 * 60 * 60 * 24);
          return daysAgo >= 60 && daysAgo < 61;
        })?.close;

        priceMap[stock.ticker] = {
          currentPrice,
          change30d: price30dAgo ? (currentPrice - price30dAgo) / price30dAgo : null,
          change60d: price60dAgo ? (currentPrice - price60dAgo) / price60dAgo : null
        };
      }
    });

    return res.status(200).json(priceMap);
  } catch (error) {
    console.error('Error fetching stock prices:', error);
    return res.status(500).json({ message: 'Failed to fetch stock prices' });
  }
}

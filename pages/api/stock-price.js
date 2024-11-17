import StockAnalyzer from '../../utils/stockAnalyzer';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  try {
    const symbol = req.query.ticker || req.query.symbol;
    const apiKey = process.env.FMP_API_KEY;

    console.log('\n=== Starting API Request for', symbol, '===\n');

    const [quote, profile, ratios, growth] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/ratios/${symbol}?apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/financial-growth/${symbol}?apikey=${apiKey}`)
    ]);

    const [quoteData, profileData, ratiosData, growthData] = await Promise.all([
      quote.json(),
      profile.json(),
      ratios.json(),
      growth.json()
    ]);

    console.log('\n=== Quote Data ===');
    console.log(JSON.stringify(quoteData, null, 2));

    console.log('\n=== Profile Data ===');
    console.log(JSON.stringify(profileData, null, 2));

    console.log('\n=== Ratios Data ===');
    console.log(JSON.stringify(ratiosData, null, 2));

    console.log('\n=== Growth Data ===');
    console.log(JSON.stringify(growthData, null, 2));

    // Combine the data
    const stockInfo = {
      symbol,
      companyName: profileData[0]?.companyName,
      currentPrice: quoteData[0]?.price,
      trailingPE: quoteData[0]?.pe,
      pegRatio: ratiosData[0]?.priceEarningsToGrowthRatio,
      priceToBook: quoteData[0]?.priceToBook || ratiosData[0]?.priceToBookRatio,
      quarterlyRevenueGrowth: growthData[0]?.revenueGrowth,
      quarterlyEarningsGrowth: growthData[0]?.epsgrowth,
      currentRatio: ratiosData[0]?.currentRatio,
      debtToEquity: ratiosData[0]?.debtEquityRatio
    };

    console.log('\n=== Combined Stock Info ===');
    console.log(JSON.stringify(stockInfo, null, 2));

    res.status(200).json(stockInfo);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stock data', 
      details: error.message 
    });
  }
}

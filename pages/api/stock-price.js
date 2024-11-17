// pages/api/stock-price.js
import StockAnalyzer from '../../utils/stockAnalyzer';

export default async function handler(req, res) {
  try {
    const { ticker } = req.query;
    const apiKey = process.env.FMP_API_KEY;

    const [quote, profile, ratios, growth] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/ratios/${ticker}?apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/financial-growth/${ticker}?apikey=${apiKey}`)
    ]);

    const [quoteData, profileData, ratiosData, growthData] = await Promise.all([
      quote.json(),
      profile.json(),
      ratios.json(),
      growth.json()
    ]);

    // Debug logs for raw API responses
    console.log('Raw Quote Data:', JSON.stringify(quoteData, null, 2));
    console.log('Raw Ratios Data:', JSON.stringify(ratiosData, null, 2));

    // Create the stock info object with all the metrics
    const stockInfo = {
      symbol: ticker,
      companyName: profileData[0]?.companyName,
      currentPrice: quoteData[0]?.price,
      trailingPE: quoteData[0]?.pe,
      pegRatio: ratiosData[0]?.priceEarningsToGrowthRatio,
      priceToBook: quoteData[0]?.priceToBook || ratiosData[0]?.priceToBookRatio, // Try both sources
      currentRatio: ratiosData[0]?.currentRatio,
      debtToEquity: ratiosData[0]?.debtEquityRatio,
      quarterlyRevenueGrowth: growthData[0]?.revenueGrowth,
      quarterlyEarningsGrowth: growthData[0]?.epsgrowth
    };

    // Debug log for processed stock info
    console.log('Processed Stock Info:', JSON.stringify(stockInfo, null, 2));

    // Create analyzer instance and process data
    const analyzer = new StockAnalyzer();
    
    // Get the full analysis including scores and classifications
    const analysis = analyzer.analyzeStock(stockInfo);

    // Log the data at each step for debugging
    console.log('Cleaning data:', stockInfo);
    console.log('Final Scores:', analysis.metrics);

    // Send the complete analysis
    res.status(200).json(analysis.metrics);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stock data', 
      details: error.message,
      stack: error.stack 
    });
  }
}

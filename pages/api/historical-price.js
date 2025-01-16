// pages/api/historical-price.js
export default async function handler(req, res) {
  try {
    const { ticker } = req.query;
    
    console.log('Fetching data for ticker:', ticker);
    
    // Get historical data for the stock
    console.log('Fetching stock data...');
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`);
    
    if (!response.ok) {
      throw new Error(`Stock API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      throw new Error(`No historical data available for ${ticker}`);
    }

    const stockData = data.chart.result[0];
    const timestamps = stockData.timestamp;
    const quotes = stockData.indicators.quote[0];
    
    // Create the chart data with closing prices (keeping chronological order)
    const chartData = timestamps.map((timestamp, index) => {
      const date = new Date(timestamp * 1000);
      return {
        date: date.toISOString(),
        stockPrice: quotes.close[index],
        stockNormalized: (quotes.close[index] / quotes.close[0]) * 100
      };
    }).filter(item => item.stockPrice !== null);

    // Calculate percentage changes for different periods using reversed indices
    const calculatePercentageChange = (days) => {
      const lastIndex = chartData.length - 1;
      if (chartData.length < days) {
        return {
          change: 0,
          startPrice: chartData[0].stockPrice,
          endPrice: chartData[lastIndex].stockPrice,
          startDate: chartData[0].date,
          endDate: chartData[lastIndex].date
        };
      }

      const endPrice = chartData[lastIndex].stockPrice;
      const startPrice = chartData[Math.max(lastIndex - days + 1, 0)].stockPrice;
      const percentageChange = ((endPrice - startPrice) / startPrice) * 100;

      return {
        change: percentageChange,
        startPrice: startPrice,
        endPrice: endPrice,
        startDate: chartData[Math.max(lastIndex - days + 1, 0)].date,
        endDate: chartData[lastIndex].date
      };
    };

    const periodChanges = {
      '14d': calculatePercentageChange(14),
      '30d': calculatePercentageChange(30),
      '90d': calculatePercentageChange(90)
    };

    console.log('Successfully processed data');
    res.status(200).json({
      chartData,
      metadata: {
        stockSymbol: ticker,
        periodChanges,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch historical data',
      details: error.stack
    });
  }
}

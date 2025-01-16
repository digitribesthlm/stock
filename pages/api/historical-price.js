// pages/api/historical-price.js
export default async function handler(req, res) {
  try {
    const { ticker } = req.query;
    
    console.log('Fetching data for ticker:', ticker);
    
    // Get historical data for both the stock and NASDAQ
    const [stockResponse, nasdaqResponse] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`),
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?range=1y&interval=1d`)  // Fixed NASDAQ symbol
    ]);
    
    if (!stockResponse.ok) {
      throw new Error(`Stock API request failed with status ${stockResponse.status}`);
    }
    if (!nasdaqResponse.ok) {
      throw new Error(`NASDAQ API request failed with status ${nasdaqResponse.status}`);
    }

    const [stockData, nasdaqData] = await Promise.all([
      stockResponse.json(),
      nasdaqResponse.json()
    ]);
    
    if (!stockData.chart?.result?.[0]) {
      throw new Error(`No historical data available for ${ticker}`);
    }
    if (!nasdaqData.chart?.result?.[0]) {
      throw new Error('No historical data available for NASDAQ');
    }

    const stock = stockData.chart.result[0];
    const nasdaq = nasdaqData.chart.result[0];

    console.log('Got NASDAQ data points:', nasdaq.timestamp.length);
    console.log('Got Stock data points:', stock.timestamp.length);

    // Get the first valid NASDAQ price for normalization
    const firstNasdaqPrice = nasdaq.indicators.quote[0].close.find(price => price !== null);
    console.log('First NASDAQ price:', firstNasdaqPrice);

    // Create a map of dates to NASDAQ values for easy lookup
    const nasdaqByDate = {};
    nasdaq.timestamp.forEach((timestamp, index) => {
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      const price = nasdaq.indicators.quote[0].close[index];
      if (price !== null) {
        nasdaqByDate[date] = price;
      }
    });

    console.log('NASDAQ dates available:', Object.keys(nasdaqByDate).length);

    // Get the first valid stock price for normalization
    const firstStockPrice = stock.indicators.quote[0].close.find(price => price !== null);
    console.log('First stock price:', firstStockPrice);

    // Create the chart data with closing prices (keeping chronological order)
    const chartData = stock.timestamp.map((timestamp, index) => {
      const date = new Date(timestamp * 1000);
      const dateStr = date.toISOString();
      const dateLookup = dateStr.split('T')[0];
      const stockPrice = stock.indicators.quote[0].close[index];
      const nasdaqPrice = nasdaqByDate[dateLookup];

      // Only include points where we have both stock and NASDAQ data
      if (stockPrice !== null && nasdaqPrice !== null && firstStockPrice !== null && firstNasdaqPrice !== null) {
        return {
          date: dateStr,
          stockPrice,
          nasdaqPrice,
          stockNormalized: (stockPrice / firstStockPrice) * 100,
          nasdaqNormalized: (nasdaqPrice / firstNasdaqPrice) * 100
        };
      }
      return null;
    }).filter(item => item !== null);

    console.log('Final data points:', chartData.length);
    console.log('Sample data point:', chartData[0]);

    // Calculate percentage changes for different periods
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

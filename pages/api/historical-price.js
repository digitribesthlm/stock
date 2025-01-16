// pages/api/historical-price.js
export default async function handler(req, res) {
  try {
    const { ticker } = req.query;
    const apiKey = process.env.FMP_API_KEY;
    
    // Get historical data for the past year
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?from=${getOneYearAgo()}&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (!data.historical) {
      throw new Error('No historical data available');
    }

    // Format the data for the chart
    const chartData = data.historical.reverse().map(item => ({
      date: item.date,
      price: item.close
    }));

    res.status(200).json(chartData);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
}

function getOneYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split('T')[0];
}

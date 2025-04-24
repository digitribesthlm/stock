export default async function handler(req, res) {
  try {
    const { ticker } = req.query;
    
    if (!ticker) {
      return res.status(400).json({ message: 'Ticker symbol is required' });
    }

    const apiKey = process.env.STOCK_API_KEY;
    const apiUrl = process.env.STOCK_API_URL;
    
    if (!apiKey || !apiUrl) {
      return res.status(500).json({ message: 'API configuration missing' });
    }

    console.log(`Fetching stock analysis for ticker: ${ticker}`);
    
    try {
      const response = await fetch(`${apiUrl}?ticker=${ticker}&token=${apiKey}`);
      
      if (!response.ok) {
        console.error(`API returned error status: ${response.status}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if we got valid data
      if (!data || data.error) {
        console.error('Invalid data returned:', data);
        return res.status(404).json({ 
          message: 'No valid stock data found', 
          ticker,
          details: data.error || 'The analysis service could not process this ticker' 
        });
      }
      
      // Return the data from the external API
      res.status(200).json(data);
    } catch (error) {
      // This will catch network errors and API response errors
      console.error(`Error while fetching data for ${ticker}:`, error);
      
      // For international stocks that might not be supported, provide a more specific message
      if (ticker.includes('.')) {
        return res.status(404).json({
          message: 'Stock not found or not supported',
          ticker,
          details: `International stocks (like ${ticker}) may not be fully supported by the analysis service.`
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to fetch stock analysis', 
        error: error.message 
      });
    }
    
  } catch (error) {
    console.error('Stock analysis API error:', error);
    res.status(500).json({ 
      message: 'Failed to process request', 
      error: error.message 
    });
  }
} 
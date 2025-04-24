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

    const response = await fetch(`${apiUrl}?ticker=${ticker}&token=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the data from the external API
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Stock analysis API error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch stock analysis', 
      error: error.message 
    });
  }
} 
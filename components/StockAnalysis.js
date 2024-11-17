import { useState } from 'react';
import StockAnalyzer from '../utils/stockAnalyzer';

export default function StockAnalysis({ symbol }) {
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const analyzer = new StockAnalyzer();

  const fetchAnalysis = async () => {
    try {
      setError(null);
      const result = await analyzer.analyzeStock(symbol);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze stock data');
      console.error(err);
    }
  };

  const fetchStockData = async (ticker) => {
    try {
      console.log('Fetching data for ticker:', ticker);
      const response = await fetch(`/api/stock-price?ticker=${ticker}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  };

  // ... render your analysis data ...
} 
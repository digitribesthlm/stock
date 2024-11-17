// pages/dashboard/index.js
import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function Dashboard() {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStockData = async () => {
    if (!ticker) {
      setError('Please enter a stock ticker');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/stock-price?ticker=${ticker}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stock data');
      }
      
      setStockData(data);
    } catch (err) {
      setError(err.message);
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stock Analysis Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Stock Analysis</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Enter stock ticker (e.g., AAPL)"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={fetchStockData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {loading ? 'Analyzing...' : 'Analyze Stock'}
              </button>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            {stockData && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">{stockData.companyName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-600">Current Price</p>
                      <p className="text-lg font-semibold">{stockData.currentPrice}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Graham Score</p>
                      <p className="text-lg font-semibold">{stockData.grahamScore}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lynch Score</p>
                      <p className="text-lg font-semibold">{stockData.lynchScore}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Valuation Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">P/E Ratio</span>
                        <span>{stockData.valuationMetrics.peRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">PEG Ratio</span>
                        <span>{stockData.valuationMetrics.pegRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price/Book</span>
                        <span>{stockData.valuationMetrics.priceToBook}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Growth Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue Growth (YoY)</span>
                        <span>{stockData.growthMetrics.revenueGrowth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Earnings Growth (YoY)</span>
                        <span>{stockData.growthMetrics.earningsGrowth}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Financial Health</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Ratio</span>
                        <span>{stockData.financialHealth.currentRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Debt/Equity</span>
                        <span>{stockData.financialHealth.debtToEquity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {stockData.warnings && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-yellow-800">Data Warnings</h4>
                    <p className="text-yellow-700">{stockData.warnings}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

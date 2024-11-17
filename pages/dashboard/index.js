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

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (typeof num === 'number') {
      if (Math.abs(num) >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
      } else if (Math.abs(num) >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
      } else if (Math.abs(num) >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
      }
      return num.toFixed(2);
    }
    return num;
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toFixed(2) + '%';
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
                  <h3 className="text-lg font-semibold mb-3">{stockData.companyName} ({stockData.symbol})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-600">Current Price</p>
                      <p className="text-lg font-semibold">${formatNumber(stockData.currentPrice)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Graham Score</p>
                      <p className="text-lg font-semibold">{formatNumber(stockData.grahamScore)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lynch Score</p>
                      <p className="text-lg font-semibold">{formatNumber(stockData.lynchScore)}</p>
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
                        <span>{formatNumber(stockData.trailingPE)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">PEG Ratio</span>
                        <span>{formatNumber(stockData.pegRatio)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price/Book</span>
                        <span>{formatNumber(stockData.priceToBook)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Growth Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue Growth (YoY)</span>
                        <span>{formatPercentage(stockData.quarterlyRevenueGrowth * 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Earnings Growth (YoY)</span>
                        <span>{formatPercentage(stockData.quarterlyEarningsGrowth * 100)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Financial Health</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Ratio</span>
                        <span>{formatNumber(stockData.currentRatio)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Debt/Equity</span>
                        <span>{formatNumber(stockData.debtToEquity)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lynch Classifications */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Lynch Classifications</h4>
                  <p className="text-gray-800">{stockData.lynchClassifications}</p>
                </div>

                {/* Warnings */}
                {stockData.missingDataWarnings && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-yellow-800">Data Warnings</h4>
                    <p className="text-yellow-700">{stockData.missingDataWarnings}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
          <p className="text-gray-600">Here's an overview of your topics and recent activity.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-gray-600 mb-1">Total Topics</div>
            <div className="text-3xl font-bold">24</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-gray-600 mb-1">Active Topics</div>
            <div className="text-3xl font-bold">12</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-gray-600 mb-1">Completed Topics</div>
            <div className="text-3xl font-bold">8</div>
          </div>
        </div>

        {/* Recent Topics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Topics</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Topic Name {item}</h3>
                  <p className="text-sm text-gray-600">Last updated 2 days ago</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700">View Details</button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-4 text-left hover:bg-gray-50 rounded-lg">
              <h3 className="font-medium">Create New Topic</h3>
              <p className="text-sm text-gray-600">Start a new topic from scratch</p>
            </button>
            <button className="p-4 text-left hover:bg-gray-50 rounded-lg">
              <h3 className="font-medium">Import Topics</h3>
              <p className="text-sm text-gray-600">Import topics from external sources</p>
            </button>
            <button className="p-4 text-left hover:bg-gray-50 rounded-lg">
              <h3 className="font-medium">Generate Report</h3>
              <p className="text-sm text-gray-600">Create a summary report</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

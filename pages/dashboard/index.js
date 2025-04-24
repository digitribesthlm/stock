// pages/dashboard/index.js
import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function Dashboard() {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState(null);
  const [lynchData, setLynchData] = useState(null);
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
      // Fetch both APIs in parallel
      const [stockResponse, lynchResponse] = await Promise.all([
        fetch(`/api/stock-price?ticker=${ticker}`),
        fetch(`/api/stock-analysis?ticker=${ticker}`)
      ]);
      
      // Process the regular stock data
      const stockResponseData = await stockResponse.json();
      if (!stockResponse.ok) {
        throw new Error(stockResponseData.message || 'Failed to fetch stock data');
      }
      setStockData(stockResponseData);
      
      // Process the Lynch analysis data
      const lynchResponseData = await lynchResponse.json();
      if (!lynchResponse.ok) {
        throw new Error(lynchResponseData.message || 'Failed to fetch Lynch analysis');
      }
      setLynchData(lynchResponseData);
      
    } catch (err) {
      setError(err.message);
      setStockData(null);
      setLynchData(null);
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
            
            {/* Display both regular and Lynch data if available */}
            {(stockData || lynchData) && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">
                    {lynchData ? lynchData["Company Name"] : stockData?.companyName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-600">Current Price</p>
                      <p className="text-lg font-semibold">
                        ${lynchData ? lynchData["Current Price"].toFixed(2) : stockData?.currentPrice}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Graham Score</p>
                      <p className="text-lg font-semibold">
                        {lynchData ? lynchData["Graham Score"] : stockData?.grahamScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lynch Score</p>
                      <p className="text-lg font-semibold">
                        {lynchData ? lynchData["Lynch Score"] : stockData?.lynchScore}
                      </p>
                    </div>
                  </div>
                </div>

                {/* External Lynch Analysis */}
                {lynchData && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium mb-2 text-blue-800">Peter Lynch Analysis</h4>
                    <p className="text-blue-700 mb-3">{lynchData["Lynch Classifications"]}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-gray-600">Trailing P/E</p>
                        <p className="font-semibold">{lynchData.trailingPE.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">PEG Ratio</p>
                        <p className="font-semibold">{lynchData.pegRatio.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price/Book</p>
                        <p className="font-semibold">{lynchData.priceToBook.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Current Ratio</p>
                        <p className="font-semibold">{lynchData.currentRatio.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Debt/Equity</p>
                        <p className="font-semibold">{lynchData.debtToEquity.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Latest Data</p>
                        <p className="font-semibold">{new Date(lynchData["Latest Data Time"]).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="font-medium mb-1">Growth Metrics</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-gray-600">Revenue Growth (Quarterly)</p>
                          <p className="font-semibold">{(lynchData.quarterlyRevenueGrowth * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Earnings Growth (Quarterly)</p>
                          <p className="font-semibold">{(lynchData.quarterlyEarningsGrowth * 100).toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                    
                    {lynchData["Missing Data Warnings"] && (
                      <div className="mt-3 text-yellow-700">
                        <p><span className="font-semibold">Warnings:</span> {lynchData["Missing Data Warnings"]}</p>
                      </div>
                    )}
                  </div>
                )}

                {stockData && (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// pages/dashboard/index.js
import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function Dashboard() {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState(null);
  const [lynchData, setLynchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [marketSuffix, setMarketSuffix] = useState('');
  const [tickerType, setTickerType] = useState('');

  const getFormattedTicker = () => {
    let formattedTicker = ticker.trim();
    
    // Add ticker type (A/B) if specified and not already in the ticker
    if (tickerType && !formattedTicker.includes('-' + tickerType)) {
      formattedTicker = `${formattedTicker}-${tickerType}`;
    }
    
    // Add market suffix if specified and not already in the ticker
    if (marketSuffix && !formattedTicker.endsWith(marketSuffix)) {
      formattedTicker = `${formattedTicker}${marketSuffix}`;
    }
    
    return formattedTicker;
  };

  const fetchStockData = async () => {
    if (!ticker) {
      setError('Please enter a stock ticker');
      return;
    }

    const formattedTicker = getFormattedTicker();

    setLoading(true);
    setError('');
    setLynchData(null);
    setStockData(null);
    
    try {
      // Fetch the regular stock data first
      const stockResponse = await fetch(`/api/stock-price?ticker=${formattedTicker}`);
      const stockResponseData = await stockResponse.json();
      
      if (!stockResponse.ok) {
        throw new Error(stockResponseData.message || 'Failed to fetch stock data');
      }
      
      setStockData(stockResponseData);
      
      // Then try to fetch the Lynch analysis data, but don't fail the whole request if it fails
      try {
        const lynchResponse = await fetch(`/api/stock-analysis?ticker=${formattedTicker}`);
        const lynchResponseData = await lynchResponse.json();
        
        if (lynchResponse.ok) {
          setLynchData(lynchResponseData);
        } else {
          console.warn('Lynch analysis unavailable:', lynchResponseData.message || 'Unknown error');
          // Don't set an error, just don't show Lynch data
        }
      } catch (lynchErr) {
        console.error('Error fetching Lynch analysis:', lynchErr);
        // Again, don't set an error, just don't show Lynch data
      }
      
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
          
          {/* Formatting hints */}
          <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
            <h3 className="font-medium text-blue-800 mb-1">Ticker Format Guide:</h3>
            <ul className="list-disc pl-5 text-blue-700 space-y-1">
              <li>US Stocks: Simple ticker symbol (e.g., <span className="font-mono">AAPL</span>, <span className="font-mono">MSFT</span>)</li>
              <li>Swedish Stocks: Ticker with suffix (e.g., <span className="font-mono">STAR-B.ST</span>, <span className="font-mono">ERIC-B.ST</span>)</li>
              <li>Other International: Check the Yahoo Finance symbol format</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Ticker input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Enter stock ticker (e.g., AAPL, STAR)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              
              {/* Stock type selector (e.g., A/B shares) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Type (Optional)</label>
                <select
                  value={tickerType}
                  onChange={(e) => setTickerType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">None</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              
              {/* Market suffix selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market (Optional)</label>
                <select
                  value={marketSuffix}
                  onChange={(e) => setMarketSuffix(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">US (Default)</option>
                  <option value=".ST">Sweden (.ST)</option>
                  <option value=".L">London (.L)</option>
                  <option value=".F">Frankfurt (.F)</option>
                  <option value=".TO">Toronto (.TO)</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchStockData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {loading ? 'Analyzing...' : 'Analyze Stock'}
              </button>
              
              {/* Preview of the formatted ticker */}
              {ticker && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Formatted ticker:</span> <code className="bg-gray-100 px-2 py-1 rounded">{getFormattedTicker()}</code>
                </div>
              )}
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            {/* Display both regular and Lynch data if available */}
            {stockData && (
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

                {/* Message when Lynch Analysis is not available */}
                {!lynchData && (
                  <div className="bg-gray-100 border-l-4 border-blue-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0 text-blue-500">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">Lynch Analysis Not Available</span>
                          <br />
                          Lynch Analysis is currently not available for {getFormattedTicker()}. This may be due to:
                        </p>
                        <ul className="mt-2 text-sm text-gray-700 list-disc pl-5">
                          <li>International stocks outside the US market</li>
                          <li>Newly listed companies with limited financial data</li>
                          <li>Temporary issues with the Lynch Analysis service</li>
                        </ul>
                        <p className="mt-2 text-sm text-gray-700">
                          Basic financial data is still available below.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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

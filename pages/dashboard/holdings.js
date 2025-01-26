import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function Holdings() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    shares: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    category: 'growth',
    pegRatio: '',
    insiderOwnership: '',
    debtToEquity: '',
    growthRate: '',
    profitMargins: '',
    notes: '',
    lynchScore: 0
  });
  const [availableTickers, setAvailableTickers] = useState([]);
  const [tickerSearch, setTickerSearch] = useState('');

  // Add this helper function at the top of your file
  const formatNumber = (value, decimals = 1) => {
    return value ? Number(value).toFixed(decimals) : '0.0';
  };

  // Add fetch effect to load holdings from MongoDB
  useEffect(() => {
    const fetchHoldings = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/holdings');
        const data = await response.json();
        
        // Transform MongoDB data to match your current state structure
        const transformedHoldings = data.map(holding => ({
          id: holding._id,
          symbol: holding.symbol,
          shares: holding.quantity,
          purchasePrice: holding.averageEntryPrice,
          purchaseDate: new Date(holding.transactions[0].date).toISOString().split('T')[0],
          category: holding.currentAnalysis.category,
          pegRatio: holding.currentAnalysis.pegRatio,
          insiderOwnership: holding.currentAnalysis.insiderOwnership * 100, // Convert to percentage
          debtToEquity: holding.currentAnalysis.debtEquityRatio,
          growthRate: holding.currentAnalysis.earningsGrowth * 100, // Convert to percentage
          profitMargins: holding.currentAnalysis.profitMargins * 100, // Convert to percentage
          notes: holding.currentAnalysis.notes
        }));
        
        setHoldings(transformedHoldings);
      } catch (error) {
        setError('Failed to fetch holdings');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  // Add this effect to fetch available tickers
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const response = await fetch('/api/stocks');
        const data = await response.json();
        console.log('Fetched tickers:', data); // Debug log
        setAvailableTickers(data);
      } catch (error) {
        console.error('Error fetching tickers:', error);
      }
    };

    fetchTickers();
  }, []);

  // Add this classification function
  const classifyLynchStyle = (stockData) => {
    try {
      const classifications = [];
      
      // Extract metrics
      const marketCap = stockData.metrics?.marketCap || 0;
      const peRatio = stockData.metrics?.trailingPE || 0;
      const debtToEquity = stockData.metrics?.debtEquity || 0;
      const industry = stockData.industry || '';
      const beta = stockData.metrics?.beta || 0;
      const dividendYield = stockData.metrics?.dividendYield || 0;
      const earningsGrowth = (stockData.metrics?.earningsGrowth || 0) * 100;
      const priceGrowth = stockData.metrics?.priceGrowth || 0;

      // Growth classifications
      if (marketCap > 200e9) {
        if (earningsGrowth > 15) {
          classifications.push({
            type: "Fast Grower (Despite Size)",
            details: `Earnings Growth: ${earningsGrowth.toFixed(1)}%`
          });
        } else if (earningsGrowth > 8) {
          classifications.push({
            type: "Stalwart",
            details: `Steady Earnings Growth: ${earningsGrowth.toFixed(1)}%`
          });
        } else if (dividendYield > 0.005) {
          classifications.push({
            type: "Slow Grower",
            details: `Dividend Yield: ${(dividendYield * 100).toFixed(1)}%`
          });
        }
      } else {
        if (priceGrowth > 20 || earningsGrowth > 20) {
          classifications.push({
            type: "Fast Grower",
            details: `Growth Rate: ${Math.max(priceGrowth, earningsGrowth).toFixed(1)}%`
          });
        } else if (marketCap > 100e9 && dividendYield > 0.005 && earningsGrowth < 8) {
          classifications.push({
            type: "Slow Grower",
            details: `Dividend Yield: ${(dividendYield * 100).toFixed(1)}%`
          });
        }
      }

      // Cyclical check
      const cyclicalIndustries = ['Auto', 'Airlines', 'Steel', 'Chemical', 'Mining', 'Technology', 'Software'];
      if (cyclicalIndustries.some(ind => industry.includes(ind)) || beta > 1.2) {
        classifications.push({
          type: "Cyclical",
          details: `Beta: ${beta.toFixed(2)}, Industry: ${industry}`
        });
      }

      // Turnaround check
      if (debtToEquity > 100 || earningsGrowth < -10) {
        classifications.push({
          type: "Potential Turnaround",
          details: `Debt/Equity: ${debtToEquity.toFixed(1)}%`
        });
      }

      // Asset Play check
      if (peRatio && peRatio < 15) {
        classifications.push({
          type: "Potential Asset Play",
          details: `P/E Ratio: ${peRatio.toFixed(1)}`
        });
      }

      return classifications;
    } catch (error) {
      console.error("Error in classifyLynchStyle:", error);
      return [];
    }
  };

  // Update the handleTickerChange function to use the new classification
  const handleTickerChange = async (e) => {
    const selectedTicker = e.target.value;
    console.log('Selected ticker:', selectedTicker);
    
    if (!selectedTicker) return;

    try {
      const response = await fetch(`/api/stocks/${selectedTicker}`);
      const stockData = await response.json();
      console.log('Received stock data:', stockData);
      
      // Get Lynch classifications
      const classifications = classifyLynchStyle(stockData);
      console.log('Lynch Classifications:', classifications);

      setFormData({
        ...formData,
        symbol: stockData.ticker,
        pegRatio: stockData.metrics?.pegRatio || '',
        insiderOwnership: (stockData.metrics?.insiderHoldings * 100) || '',
        debtToEquity: stockData.metrics?.debtEquity || '',
        growthRate: (stockData.metrics?.earningsGrowth * 100) || '',
        profitMargins: (stockData.metrics?.profitMargins * 100) || '',
        notes: classifications.map(c => `${c.type}: ${c.details}`).join('\n'),
        classifications: classifications
      });
      
      console.log('Updated form data with classifications:', formData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  // Add comprehensive score calculation
  const getLatestMetrics = (ratiosData) => {
    if (!ratiosData || ratiosData.length === 0) {
      console.warn('No ratios data available');
      return null;
    }

    // Sort by date descending
    const sortedRatios = ratiosData.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    const latestData = sortedRatios[0];
    const dataAge = Math.floor((new Date() - new Date(latestData.date)) / (1000 * 60 * 60 * 24));

    console.log(`Latest data is ${dataAge} days old, from ${latestData.date}`);

    // Alert if data is older than 90 days
    if (dataAge > 90) {
      console.warn(`Warning: Using data from ${latestData.date} which is ${dataAge} days old`);
    }

    return latestData;
  };

  const calculateScores = (metrics, ratiosData) => {
    const latestRatios = getLatestMetrics(ratiosData);
    
    if (!latestRatios) {
      console.error('Cannot calculate scores: No recent data available');
      return { 
        lynchScore: 0, 
        grahamScore: 0, 
        warning: 'No recent financial data available'
      };
    }

    // Add data freshness warning to the form
    const dataWarning = `Using financial data from ${latestRatios.date}. Data may be outdated.`;

    // Use the latest values
    const values = {
      trailingPE: metrics.trailingPE,
      currentRatio: latestRatios.currentRatio,
      priceToBook: latestRatios.priceToBookRatio,
      debtToEquity: latestRatios.debtEquityRatio * 100, // Convert to percentage
      pegRatio: latestRatios.priceEarningsToGrowthRatio,
      quarterlyRevenueGrowth: metrics.quarterlyRevenueGrowth * 100,
      quarterlyEarningsGrowth: metrics.quarterlyEarningsGrowth * 100
    };

    console.log('Using latest values:', values);

    let lynchScore = 0;
    let grahamScore = 0;

    // Lynch Score calculation
    if (values.pegRatio > 0 && values.pegRatio < 1) {
      lynchScore += 3;
      console.log('Added 3 points for excellent PEG ratio < 1');
    }

    if (values.debtToEquity < 30) {
      lynchScore += 3;
      console.log('Added 3 points for excellent debt/equity ratio');
    }

    if (values.quarterlyEarningsGrowth > 50) {
      lynchScore += 3;
      console.log('Added 3 points for excellent earnings growth');
    }

    // Graham Score calculation
    if (values.trailingPE < 15) grahamScore += 1.5;
    if (values.currentRatio > 1.5) grahamScore += 1.5;
    if (values.priceToBook < 1.5) grahamScore += 1.5;
    if (values.debtToEquity < 40) grahamScore += 1.5;

    console.log('Final Scores:', { 
      lynchScore, 
      grahamScore,
      warning: dataWarning,
      dataDate: latestRatios.date,
      metrics: values
    });
    
    return { 
      lynchScore, 
      grahamScore,
      warning: dataWarning,
      dataDate: latestRatios.date
    };
  };

  // Modify handleSubmit to save to MongoDB
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/holdings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: formData.symbol,
          quantity: parseInt(formData.shares),
          averageEntryPrice: parseFloat(formData.purchasePrice),
          currentAnalysis: {
            pegRatio: parseFloat(formData.pegRatio),
            insiderOwnership: parseFloat(formData.insiderOwnership) / 100,
            debtEquityRatio: parseFloat(formData.debtToEquity),
            earningsGrowth: parseFloat(formData.growthRate) / 100,
            profitMargins: parseFloat(formData.profitMargins) / 100,
            category: formData.category,
            notes: formData.notes
          },
          transactions: [{
            date: new Date(formData.purchaseDate),
            type: 'BUY',
            quantity: parseInt(formData.shares),
            pricePerShare: parseFloat(formData.purchasePrice)
          }]
        })
      });

      if (!response.ok) throw new Error('Failed to save holding');
      
      // Refresh holdings after save
      const updatedResponse = await fetch('/api/holdings');
      const updatedData = await updatedResponse.json();
      setHoldings(updatedData);
      
      // Reset form
      setFormData({
        symbol: '',
        shares: '',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        category: 'growth',
        pegRatio: '',
        insiderOwnership: '',
        debtToEquity: '',
        growthRate: '',
        profitMargins: '',
        notes: '',
        lynchScore: 0
      });
    } catch (error) {
      setError('Failed to save holding');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateTotalValue = (holding) => {
    return parseFloat(holding.shares) * parseFloat(holding.purchasePrice);
  };

  const getHoldingsByCategory = (category) => {
    return holdings.filter(holding => holding.category === category);
  };

  // Modify filter function with debug logs
  const filteredTickers = availableTickers.filter(stock => {
    console.log('Filtering stock:', stock); // Debug log
    console.log('Search term:', tickerSearch); // Debug log
    return (
      stock.ticker?.toLowerCase().includes(tickerSearch.toLowerCase()) ||
      stock.company?.toLowerCase().includes(tickerSearch.toLowerCase())
    );
  });

  // Update the input handler with debug log
  const handleSearchChange = (e) => {
    console.log('Search changed:', e.target.value); // Debug log
    setTickerSearch(e.target.value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Holdings Calculator</h1>
        
        {/* Add New Holding Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Holding</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Symbol</label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    placeholder="Search ticker or company..."
                    value={tickerSearch}
                    onChange={handleSearchChange}
                    className="mb-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <select
                    name="symbol"
                    value={formData.symbol}
                    onChange={(e) => {
                      handleTickerChange(e);
                      handleChange(e);
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a ticker</option>
                    {filteredTickers.map(stock => (
                      <option key={stock.ticker} value={stock.ticker}>
                        {stock.ticker} - {stock.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Shares</label>
                <input
                  type="text"
                  name="shares"
                  value={formData.shares}
                  onChange={handleChange}
                  pattern="^\d*\.?\d*$"
                  placeholder="e.g., 100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                <input
                  type="text"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  pattern="^\d*\.?\d*$"
                  placeholder="e.g., 123.45"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Analysis Metrics */}
              <div>
                <label className="block text-sm font-medium text-gray-700">PEG Ratio</label>
                <input
                  type="text"
                  name="pegRatio"
                  value={formData.pegRatio}
                  onChange={handleChange}
                  pattern="^\d*\.?\d*$"
                  placeholder="e.g., 0.27"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Insider Ownership (%)</label>
                <input
                  type="text"
                  name="insiderOwnership"
                  value={formData.insiderOwnership}
                  onChange={handleChange}
                  pattern="^\d*\.?\d*$"
                  placeholder="e.g., 5.4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Debt/Equity (%)</label>
                <input
                  type="text"
                  name="debtToEquity"
                  value={formData.debtToEquity}
                  onChange={handleChange}
                  pattern="^\d*\.?\d*$"
                  placeholder="e.g., 9.1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Growth Rate (%)</label>
                <input
                  type="text"
                  name="growthRate"
                  value={formData.growthRate}
                  onChange={handleChange}
                  pattern="^\d*\.?\d*$"
                  placeholder="e.g., 16.4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profit Margins (%)</label>
                <input
                  type="text"
                  name="profitMargins"
                  value={formData.profitMargins}
                  onChange={handleChange}
                  pattern="^\d*\.?\d*$"
                  placeholder="e.g., 32.4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="growth">Growth</option>
                  <option value="value">Value</option>
                  <option value="institutional">Institutional</option>
                  <option value="dividend">Dividend</option>
                </select>
              </div>

              {/* Notes - Full Width */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Analysis Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Additional analysis notes..."
                />
              </div>

              {/* Lynch Classifications */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Lynch Classifications</label>
                <div className="mt-1 space-y-2">
                  {formData.classifications?.map((classification, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded-md">
                      <p className="font-medium text-blue-900">{classification.type}</p>
                      <p className="text-sm text-blue-700">{classification.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 rounded-md">
              <p className="text-yellow-700 text-sm">
                {formData.warning}
              </p>
              <p className="text-yellow-600 text-xs mt-1">
                Last updated: {formData.dataDate}
              </p>
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Holding
            </button>
          </form>
        </div>

        {/* Holdings Table */}
        <div className="bg-white p-6 rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold mb-4">Current Holdings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PEG Ratio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insider Own.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D/E Ratio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margins</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holdings.map((holding) => (
                  <tr key={holding.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{holding.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(holding.purchaseDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{holding.shares}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${parseFloat(holding.purchasePrice || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${calculateTotalValue(holding).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatNumber(holding.pegRatio)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatNumber(holding.insiderOwnership)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatNumber(holding.debtToEquity)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatNumber(holding.growthRate)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatNumber(holding.profitMargins)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{holding.category}</td>
                    <td className="px-6 py-4">{holding.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Category Analysis</h2>
            <div className="space-y-4">
              {['growth', 'value', 'institutional', 'dividend'].map(category => (
                <div key={category} className="flex justify-between items-center">
                  <span className="capitalize">{category}</span>
                  <span className="font-medium">
                    {getHoldingsByCategory(category).length} holdings
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Value by Category */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Value Distribution</h2>
            <div className="space-y-4">
              {['growth', 'value', 'institutional', 'dividend'].map(category => {
                const categoryHoldings = getHoldingsByCategory(category);
                const totalValue = categoryHoldings.reduce((sum, holding) => 
                  sum + calculateTotalValue(holding), 0
                );
                return (
                  <div key={category} className="flex justify-between items-center">
                    <span className="capitalize">{category}</span>
                    <span className="font-medium">${totalValue.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

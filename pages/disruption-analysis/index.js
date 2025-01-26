import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

// Modal component for displaying detailed analysis
function DisruptionModal({ analysis, onClose }) {
  if (!analysis) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{analysis.ticker}</h2>
              <p className="text-gray-600">{analysis.company}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Overall Disruption Score */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Overall Disruption Score</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.overallDisruption.score}/{analysis.overallDisruption.maxScore}
                </div>
              </div>
              <p className="text-blue-800">{analysis.overallDisruption.description}</p>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysis.categories).map(([category, data]) => (
                <div key={category} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 capitalize mb-2">
                    {category} Disruption
                  </h4>
                  <div className="mb-2">
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      data.level === 'High' ? 'bg-green-100 text-green-800' :
                      data.level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      data.level === 'Low' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {data.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{data.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DisruptionAnalysis() {
  const [analyses, setAnalyses] = useState([]);
  const [stockChanges, setStockChanges] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedDate, setSelectedDate] = useState('all');

  // Analysis filters
  const analysisFilters = [
    'Good PEG ratio',
    'Good insider ownership',
    'Low debt',
    'Strong growth',
    'Strong margins',
    'Low institutional ownership'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First get all disruption analyses to get the tickers
        const analysesResponse = await fetch('/api/disruption-analyses');
        if (!analysesResponse.ok) throw new Error('Failed to fetch analyses');
        const analysesData = await analysesResponse.json();
        console.log('Got analyses:', analysesData);
        setAnalyses(analysesData);

        // Check sessionStorage for cached stock data
        const cachedData = sessionStorage.getItem('stockChanges');
        const cachedTimestamp = sessionStorage.getItem('stockChangesTimestamp');
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        // Use cached data if it's fresh enough
        if (cachedData && cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) < CACHE_DURATION) {
          console.log('Using cached stock changes');
          setStockChanges(JSON.parse(cachedData));
          return;
        }

        // Fetch fresh stock data for each ticker
        const changes = {};
        for (const analysis of analysesData) {
          const ticker = analysis.ticker;
          if (!changes[ticker]) {
            console.log('Fetching stock data for:', ticker);
            try {
              // Get company info
              const stockResponse = await fetch(`/api/stocks/${ticker}`);
              let companyName = ticker;
              if (stockResponse.ok) {
                const stockData = await stockResponse.json();
                companyName = stockData.company || ticker;
              }

              // Get historical prices
              const historyResponse = await fetch(`/api/historical-price?ticker=${ticker}`);
              if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                console.log('History data for', ticker, ':', historyData);
                
                if (historyData.metadata?.periodChanges) {
                  changes[ticker] = {
                    change30d: historyData.metadata.periodChanges['30d']?.change,
                    change90d: historyData.metadata.periodChanges['90d']?.change,
                    company: companyName
                  };
                  console.log('Calculated changes for', ticker, ':', changes[ticker]);
                } else {
                  console.warn('No period changes found for', ticker);
                }
              } else {
                const errorText = await historyResponse.text();
                console.error('Failed to fetch history for', ticker, ':', historyResponse.status, errorText);
              }
            } catch (err) {
              console.error(`Error fetching data for ${ticker}:`, err);
            }
          }
        }

        // Cache the results
        console.log('Caching final changes:', changes);
        sessionStorage.setItem('stockChanges', JSON.stringify(changes));
        sessionStorage.setItem('stockChangesTimestamp', Date.now().toString());
        
        setStockChanges(changes);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date) => {
    if (!date || !date.$date) return new Date().toLocaleDateString(); // Use today's date if none provided
    try {
      return new Date(date.$date).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return new Date().toLocaleDateString(); // Fallback to today's date
    }
  };

  const formatScore = (score) => {
    if (!score && score !== 0) return '-';
    return (
      <span className={`font-semibold ${score >= 4 ? 'text-green-600' : score >= 3 ? 'text-blue-600' : 'text-red-600'}`}>
        {score}/5
      </span>
    );
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '-';
    const formattedValue = Math.abs(value).toFixed(2);
    return (
      <span className={`font-semibold ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {value > 0 ? '↑' : '↓'} {formattedValue}%
      </span>
    );
  };

  // Filter analyses by date range
  const getDateFilteredAnalyses = (analyses) => {
    if (selectedDate === 'all') return analyses;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedDate) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        return analyses;
    }

    return analyses.filter(a => {
      const analysisDate = new Date(a.analysisDate?.$date);
      return analysisDate >= cutoffDate;
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600 p-4">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Disruption Analysis</h1>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">Disruption Score Distribution & Returns</h2>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Dates</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedPeriod('30d')}
                    className={`px-3 py-1 rounded ${
                      selectedPeriod === '30d'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('90d')}
                    className={`px-3 py-1 rounded ${
                      selectedPeriod === '90d'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    90 Days
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Analysis:</label>
                <div className="flex flex-wrap gap-2">
                  {analysisFilters.map(filter => (
                    <button
                      key={filter}
                      onClick={() => {
                        setSelectedFilters(prev => 
                          prev.includes(filter)
                            ? prev.filter(f => f !== filter)
                            : [...prev, filter]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedFilters.includes(filter)
                          ? 'bg-blue-100 text-blue-800 border border-blue-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[2, 3, 4, 5].map(score => {
                const dateFilteredAnalyses = getDateFilteredAnalyses(analyses);
                const filteredAnalyses = dateFilteredAnalyses.filter(a => {
                  if (Math.floor(a.overallDisruption?.score) !== score) return false;
                  
                  // Apply analysis filters
                  if (selectedFilters.length > 0) {
                    const matchesFilters = selectedFilters.every(filter => {
                      switch (filter) {
                        case 'Good PEG ratio':
                          return a.metrics?.pegRatio < 1;
                        case 'Good insider ownership':
                          return a.metrics?.insiderOwnership > 5;
                        case 'Low debt':
                          return a.metrics?.debtToEquity < 30;
                        case 'Strong growth':
                          return a.metrics?.earningsGrowth > 25;
                        case 'Strong margins':
                          return a.metrics?.profitMargins > 20;
                        case 'Low institutional ownership':
                          return a.metrics?.institutionalOwnership < 70;
                        default:
                          return true;
                      }
                    });
                    if (!matchesFilters) return false;
                  }
                  
                  return true;
                });

                const count = filteredAnalyses.length;
                const percentage = (count / dateFilteredAnalyses.length * 100).toFixed(1);
                
                // Calculate average return for selected period
                const returns = filteredAnalyses
                  .map(a => selectedPeriod === '30d' 
                    ? stockChanges[a.ticker]?.change30d 
                    : stockChanges[a.ticker]?.change90d
                  )
                  .filter(change => change !== null && change !== undefined);
                const avgReturn = returns.length > 0
                  ? returns.reduce((sum, val) => sum + val, 0) / returns.length
                  : null;

                return (
                  <div key={score} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-lg font-semibold mb-1">
                      Score {score}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {count} stocks ({percentage}%)
                    </div>
                    {avgReturn !== null && (
                      <div className={`text-sm font-medium ${avgReturn >= 0 ? 'text-green-600' : 'text-red-600'} mb-2`}>
                        Avg {selectedPeriod === '30d' ? '30d' : '90d'}: {avgReturn >= 0 ? '↑' : '↓'} {Math.abs(avgReturn).toFixed(2)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classifications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analysis Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedPeriod === '30d' ? '30d Change' : '90d Change'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedPeriod === '30d' ? '90d Change' : '30d Change'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getDateFilteredAnalyses(analyses)
                  .filter(a => {
                    if (selectedFilters.length === 0) return true;
                    
                    return selectedFilters.every(filter => {
                      switch (filter) {
                        case 'Good PEG ratio':
                          return a.metrics?.pegRatio < 1;
                        case 'Good insider ownership':
                          return a.metrics?.insiderOwnership > 5;
                        case 'Low debt':
                          return a.metrics?.debtToEquity < 30;
                        case 'Strong growth':
                          return a.metrics?.earningsGrowth > 25;
                        case 'Strong margins':
                          return a.metrics?.profitMargins > 20;
                        case 'Low institutional ownership':
                          return a.metrics?.institutionalOwnership < 70;
                        default:
                          return true;
                      }
                    });
                  })
                  .map((analysis) => {
                    const changes = stockChanges[analysis.ticker] || {};
                    return (
                      <tr 
                        key={analysis._id.$oid || analysis.ticker} 
                        onClick={() => setSelectedAnalysis(analysis)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {analysis.ticker}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {changes.company || analysis.ticker}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Industry:</span>
                              <span>{analysis.industry}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Sector:</span>
                              <span>{analysis.sector}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(analysis.analysisDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatScore(analysis.overallDisruption?.score)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatPercentage(selectedPeriod === '30d' ? changes.change30d : changes.change90d)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatPercentage(selectedPeriod === '30d' ? changes.change90d : changes.change30d)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedAnalysis && (
          <DisruptionModal
            analysis={selectedAnalysis}
            onClose={() => setSelectedAnalysis(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

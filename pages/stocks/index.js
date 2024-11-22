import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState('grid');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/stock-details');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch stock data');
        }
        
        const data = await response.json();
        setStocks(data);
      } catch (error) {
        console.error('Error fetching stocks:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  // Helper function to safely get nested number values
  const getNumberValue = (obj, path, defaultValue = 0) => {
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    
    if (value && typeof value === 'object' && '$numberDouble' in value) {
      return Number(value.$numberDouble);
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    return defaultValue;
  };

  // Sorting function remains the same as in previous implementation

  // Render Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedStocks.map((stock) => (
        <div key={stock._id.$oid} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">{stock.ticker}</h2>
              <h3 className="text-sm text-gray-500">{stock.company}</h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs mb-2">
                {stock.metadata?.status || 'Unknown'}
              </span>
              <span className="text-xs text-gray-500">
                Updated: {new Date(stock.metadata?.lastUpdated?.$date?.$numberLong * 1).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Lynch Score</div>
                <div className="font-semibold text-blue-600 text-lg">
                  {getNumberValue(stock.analysis, 'lynchScore').toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">PEG Ratio</div>
                <div className="font-semibold text-sm">
                  {getNumberValue(stock.metrics, 'pegRatio').toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-xs text-gray-500 mb-2">Analysis Reasons</div>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {stock.analysis?.reasons?.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-xs text-gray-500 mb-2">Classifications</div>
            <div className="space-y-2">
              {stock.analysis?.classifications?.map((classification, index) => (
                <div 
                  key={index} 
                  className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm"
                >
                  <div className="font-semibold">{classification.type}</div>
                  <div className="text-xs text-blue-600">{classification.details}</div>
                  {classification.metrics && (
                    <div className="mt-1 text-xs">
                      {Object.entries(classification.metrics).map(([key, value]) => (
                        <div key={key}>
                          {key}: {getNumberValue(classification.metrics, key).toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Institutional Ownership</div>
                <div className="font-semibold text-sm">
                  {(getNumberValue(stock.metrics, 'institutionalOwnership') * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Insider Holdings</div>
                <div className="font-semibold text-sm">
                  {(getNumberValue(stock.metrics, 'insiderHoldings') * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Earnings Growth</div>
                <div className="font-semibold text-sm">
                  {(getNumberValue(stock.metrics, 'earningsGrowth') * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Profit Margins</div>
                <div className="font-semibold text-sm">
                  {(getNumberValue(stock.metrics, 'profitMargins') * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Rest of the component remains the same as in the previous implementation
  // (renderTableView, renderContent, and return statement)
  // ... [previous implementation of these methods]

  // Keeping the existing renderTableView, renderContent, and return methods from the previous implementation
  const renderTableView = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            {[
              { key: 'ticker', label: 'Ticker' },
              { key: 'lynchScore', label: 'Lynch Score' },
              { key: 'pegRatio', label: 'PEG Ratio' },
              { key: 'institutionalOwnership', label: 'Institutional Ownership' },
              { key: 'insiderHoldings', label: 'Insider Holdings' },
              { key: 'earningsGrowth', label: 'Earnings Growth' },
              { key: 'profitMargins', label: 'Profit Margins' }
            ].map(({ key, label }) => (
              <th 
                key={key}
                onClick={() => handleSort(key)}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center">
                  {label}
                  {sortConfig.key === key && (
                    <span className="ml-2">
                      {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedStocks.map((stock) => (
            <tr key={stock._id.$oid} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stock.ticker}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600">
                {getNumberValue(stock.analysis, 'lynchScore').toFixed(2)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {getNumberValue(stock.metrics, 'pegRatio').toFixed(2)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {(getNumberValue(stock.metrics, 'institutionalOwnership') * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {(getNumberValue(stock.metrics, 'insiderHoldings') * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {(getNumberValue(stock.metrics, 'earningsGrowth') * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {(getNumberValue(stock.metrics, 'profitMargins') * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Sorting function
  const sortedStocks = useMemo(() => {
    if (!sortConfig.key) return stocks;

    return [...stocks].sort((a, b) => {
      let aValue, bValue;

      switch(sortConfig.key) {
        case 'ticker':
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case 'lynchScore':
          aValue = getNumberValue(a.analysis, 'lynchScore');
          bValue = getNumberValue(b.analysis, 'lynchScore');
          break;
        case 'pegRatio':
          aValue = getNumberValue(a.metrics, 'pegRatio');
          bValue = getNumberValue(b.metrics, 'pegRatio');
          break;
        case 'institutionalOwnership':
          aValue = getNumberValue(a.metrics, 'institutionalOwnership');
          bValue = getNumberValue(b.metrics, 'institutionalOwnership');
          break;
        case 'insiderHoldings':
          aValue = getNumberValue(a.metrics, 'insiderHoldings');
          bValue = getNumberValue(b.metrics, 'insiderHoldings');
          break;
        case 'earningsGrowth':
          aValue = getNumberValue(a.metrics, 'earningsGrowth');
          bValue = getNumberValue(b.metrics, 'earningsGrowth');
          break;
        case 'profitMargins':
          aValue = getNumberValue(a.metrics, 'profitMargins');
          bValue = getNumberValue(b.metrics, 'profitMargins');
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [stocks, sortConfig]);

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      // If sorting by the same column, toggle direction
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'ascending' ? 'descending' : 'ascending'
        };
      }
      // If sorting by a new column, default to ascending
      return {
        key,
        direction: 'ascending'
      };
    });
  };

  // Render Content method remains the same
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading stock data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center bg-red-50 p-8 rounded-lg max-w-md">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      );
    }

    if (!stocks || stocks.length === 0) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center bg-gray-50 p-8 rounded-lg max-w-md">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Stocks Found</h3>
            <p className="text-gray-600">There are currently no stocks in the database.</p>
          </div>
        </div>
      );
    }

    return displayMode === 'grid' ? renderGridView() : renderTableView();
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Analysis</h1>
          <p className="mt-2 text-gray-600">View and analyze stock performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setDisplayMode('grid')}
            className={`px-4 py-2 rounded-md ${
              displayMode === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Grid View
          </button>
          <button 
            onClick={() => setDisplayMode('table')}
            className={`px-4 py-2 rounded-md ${
              displayMode === 'table' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Table View
          </button>
        </div>
      </div>
      {renderContent()}
    </DashboardLayout>
  );
}

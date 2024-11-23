import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState(null);
  const itemsPerPage = 9;
  const tableItemsPerPage = 10;

  // Initial sort config to Lynch Score descending
  const [sortConfig, setSortConfig] = useState({
    key: 'lynchScore',
    direction: 'descending'
  });

  // Filter labels
  const filterLabels = [
    'Good PEG ratio',
    'Good insider ownership',
    'Low debt',
    'Strong growth',
    'Strong margins',
    'Low institutional ownership'
  ];

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

  // Filter stocks based on active filter
  const filteredStocks = useMemo(() => {
    if (!activeFilter) return stocks;
    
    return stocks.filter(stock => 
      stock.analysis?.reasons?.some(reason => 
        reason.toLowerCase().includes(activeFilter.toLowerCase())
      )
    );
  }, [stocks, activeFilter]);

  // Helper function to safely get nested number values
  const getNumberValue = (obj, path, defaultValue = 0) => {
    if (!obj) return defaultValue;
    
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    
    if (value && typeof value === 'object' && '$numberDouble' in value) {
      return Number(value.$numberDouble);
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    return defaultValue;
  };

  // Sorting function
  const sortedStocks = useMemo(() => {
    if (!filteredStocks.length) return filteredStocks;

    return [...filteredStocks].sort((a, b) => {
      let aValue, bValue;

      switch(sortConfig.key) {
        case 'ticker':
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case 'company':
          aValue = a.company;
          bValue = b.company;
          break;
        case 'lynchScore':
          aValue = getNumberValue(a.analysis, 'lynchScore');
          bValue = getNumberValue(b.analysis, 'lynchScore');
          break;
        case 'pegRatio':
          aValue = getNumberValue(a.metrics, 'pegRatio');
          bValue = getNumberValue(b.metrics, 'pegRatio');
          break;
        case 'earningsGrowth':
          aValue = getNumberValue(a.metrics, 'earningsGrowth');
          bValue = getNumberValue(b.metrics, 'earningsGrowth');
          break;
        case 'profitMargins':
          aValue = getNumberValue(a.metrics, 'profitMargins');
          bValue = getNumberValue(b.metrics, 'profitMargins');
          break;
        case 'status':
          aValue = a.metadata?.status || 'Unknown';
          bValue = b.metadata?.status || 'Unknown';
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
  }, [filteredStocks, sortConfig]);

  // Pagination
  const paginatedStocks = useMemo(() => {
    const pageSize = displayMode === 'grid' ? itemsPerPage : tableItemsPerPage;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedStocks.slice(startIndex, startIndex + pageSize);
  }, [sortedStocks, currentPage, displayMode]);

  // Total pages calculation
  const totalPages = useMemo(() => {
    const pageSize = displayMode === 'grid' ? itemsPerPage : tableItemsPerPage;
    return Math.ceil(sortedStocks.length / pageSize);
  }, [sortedStocks, displayMode]);

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' 
        ? 'descending' 
        : 'ascending'
    }));
    setCurrentPage(1);
  };

  // Pagination handlers
  const goToNextPage = () => {
    setCurrentPage(Math.min(currentPage + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(Math.max(currentPage - 1, 1));
  };

  // Filter Bar component
  const FilterBar = () => (
    <div className="mb-6">
      <div className="text-sm text-gray-600 mb-2">Filter by Analysis:</div>
      <div className="flex flex-wrap gap-2">
        {filterLabels.map((label) => (
          <button
            key={label}
            onClick={() => {
              setActiveFilter(activeFilter === label ? null : label);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-full text-sm ${
              activeFilter === label
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
            {activeFilter === label && (
              <span className="ml-2">×</span>
            )}
          </button>
        ))}
        {activeFilter && (
          <button
            onClick={() => {
              setActiveFilter(null);
              setCurrentPage(1);
            }}
            className="px-3 py-1 rounded-full text-sm text-red-600 hover:bg-red-50"
          >
            Clear Filter
          </button>
        )}
      </div>
    </div>
  );

  // Render Grid View
  const renderGridView = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedStocks.map((stock) => (
          <div key={stock._id?.$oid} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
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
                  Updated: {new Date(Number(stock.metadata?.lastUpdated?.$date?.$numberLong)).toLocaleDateString()}
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
                    {classification.industry && (
                      <div className="text-xs mt-1">Industry: {classification.industry}</div>
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
      
      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-8 space-x-4">
        <button 
          onClick={goToPreviousPage} 
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Previous
        </button>
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={goToNextPage} 
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-md ${
            currentPage === totalPages 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Next
        </button>
      </div>
    </>
  );

  // Render Table View
  const renderTableView = () => (
    <>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              {[
                { key: 'ticker', label: 'Ticker' },
                { key: 'company', label: 'Company' },
                { key: 'lynchScore', label: 'Lynch Score' },
                { key: 'pegRatio', label: 'PEG Ratio' },
                { key: 'earningsGrowth', label: 'Earnings Growth' },
                { key: 'profitMargins', label: 'Profit Margins' },
                { key: 'status', label: 'Status' }
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
            {paginatedStocks.map((stock) => (
              <tr key={stock._id?.$oid} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{stock.ticker}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{stock.company}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                  {getNumberValue(stock.analysis, 'lynchScore').toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getNumberValue(stock.metrics, 'pegRatio').toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(getNumberValue(stock.metrics, 'earningsGrowth') * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(getNumberValue(stock.metrics, 'profitMargins') * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {stock.metadata?.status || 'Unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-8 space-x-4">
        <button 
          onClick={goToPreviousPage} 
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Previous
        </button>
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={goToNextPage} 
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-md ${
            currentPage === totalPages 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Next
        </button>
      </div>
    </>
  );

  // Render Content method
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
          <p className="mt-2 text-gray-600">
            {activeFilter 
              ? `Filtered by "${activeFilter}" and sorted by Lynch Score`
              : 'Sorted by Lynch Score (Highest First)'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              setDisplayMode('grid');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-md ${
              displayMode === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Grid View
          </button>
          <button 
            onClick={() => {
              setDisplayMode('table');
              setCurrentPage(1);
            }}
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
      
      <FilterBar />
      {renderContent()}
    </DashboardLayout>
  );
}

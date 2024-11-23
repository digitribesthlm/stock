import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

// Status options
const STATUS_OPTIONS = ['Active', 'Potential Buy', 'Bought'];

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

// Filter labels
const FILTER_LABELS = [
  'Good PEG ratio',
  'Good insider ownership',
  'Low debt',
  'Strong growth',
  'Strong margins',
  'Low institutional ownership'
];

// Status Controls Component
const StatusControls = React.memo(({ currentStatus, stockId, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = async (newStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const mongoId = stockId?.$oid || stockId;
      const response = await fetch('/api/update-stock-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: mongoId,
          status: newStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      onStatusChange(mongoId, data.stock.status, data.stock.lastUpdated);
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message);
      onStatusChange(stockId, currentStatus);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Potential Buy':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Bought':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (currentStatus === 'Potential Buy') {
    return (
      <div className="relative">
        <button
          onClick={() => updateStatus('Bought')}
          disabled={isUpdating}
          className="px-3 py-1 rounded-full text-xs leading-5 font-semibold bg-yellow-100 text-yellow-800 hover:bg-green-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : '🎯 Buy Now'}
        </button>
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-white p-1 rounded shadow-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`px-3 py-1 rounded-full text-xs leading-5 font-semibold 
          ${getStatusColor(currentStatus)}
          ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isUpdating ? 'Updating...' : currentStatus || 'Active'}
      </button>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-white p-1 rounded shadow-sm">
          {error}
        </div>
      )}
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={isUpdating}
                className={`block w-full text-left px-4 py-2 text-sm 
                  ${status === currentStatus 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-700 hover:bg-gray-50'}
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="menuitem"
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

StatusControls.displayName = 'StatusControls';

// Search Bar Component
const SearchBar = React.memo(({ searchQuery, handleSearch }) => (
  <div className="mb-6">
    <div className="relative">
      <input
        type="text"
        placeholder="Search by ticker symbol..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
        autoComplete="off"
        spellCheck="false"
      />
      {searchQuery && (
        <button
          onClick={() => handleSearch('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  </div>
));

SearchBar.displayName = 'SearchBar';

// Filter Bar Component
const FilterBar = React.memo(({ filterLabels, activeFilters, setActiveFilters, searchQuery, handleSearch, setCurrentPage }) => (
  <div className="mb-6">
    <div className="text-sm text-gray-600 mb-2">Filter by Analysis:</div>
    <div className="flex flex-wrap gap-2">
      {filterLabels.map((label) => (
        <button
          key={label}
          onClick={() => {
            setActiveFilters(prev => {
              const isActive = prev.includes(label);
              if (isActive) {
                return prev.filter(f => f !== label);
              } else {
                return [...prev, label];
              }
            });
            setCurrentPage(1);
          }}
          className={`px-3 py-1 rounded-full text-sm ${
            activeFilters.includes(label)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {label}
          {activeFilters.includes(label) && (
            <span className="ml-2">×</span>
          )}
        </button>
      ))}
      {(activeFilters.length > 0 || searchQuery) && (
        <button
          onClick={() => {
            setActiveFilters([]);
            handleSearch('');
            setCurrentPage(1);
          }}
          className="px-3 py-1 rounded-full text-sm text-red-600 hover:bg-red-50"
        >
          Clear All
        </button>
      )}
    </div>
  </div>
));

FilterBar.displayName = 'FilterBar';

// Main Page Component
const StocksPage = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'lynchScore',
    direction: 'descending'
  });

  const itemsPerPage = 9;
  const tableItemsPerPage = 10;

  // Handlers
  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((stockId, newStatus, lastUpdated) => {
    setStocks(prevStocks => 
      prevStocks.map(stock => {
        const stockMongoId = stock._id?.$oid || stock._id;
        const updateMongoId = stockId?.$oid || stockId;
        
        return stockMongoId === updateMongoId
          ? { 
              ...stock, 
              metadata: { 
                ...stock.metadata, 
                status: newStatus,
                lastUpdated: lastUpdated || new Date().toISOString()
              } 
            }
          : stock;
      })
    );
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' 
        ? 'descending' 
        : 'ascending'
    }));
    setCurrentPage(1);
  }, []);

  // Fetch stocks data
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

  // Filter stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesSearch = searchQuery === '' || 
        stock.ticker.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLabels = activeFilters.length === 0 || 
        activeFilters.every(filter =>
          stock.analysis?.reasons?.some(reason => 
            reason.toLowerCase().includes(filter.toLowerCase())
          )
        );

      return matchesSearch && matchesLabels;
    });
  }, [stocks, activeFilters, searchQuery]);

  // Sort stocks
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

  const totalPages = useMemo(() => {
    const pageSize = displayMode === 'grid' ? itemsPerPage : tableItemsPerPage;
    return Math.ceil(sortedStocks.length / pageSize);
  }, [sortedStocks, displayMode]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  // Render functions
  const renderGridView = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedStocks.map((stock) => (
          <div key={stock._id?.$oid || stock._id} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-blue-600">{stock.ticker}</h2>
                <h3 className="text-sm text-gray-500">{stock.company}</h3>
              </div>
              <div className="flex flex-col items-end">
                <StatusControls 
                  currentStatus={stock.metadata?.status || 'Active'} 
                  stockId={stock._id}
                  onStatusChange={handleStatusChange}
                />
                <span className="text-xs text-gray-500 mt-2">
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
              <tr key={stock._id?.$oid || stock._id} className="hover:bg-gray-50">
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
                  <StatusControls 
                    currentStatus={stock.metadata?.status || 'Active'} 
                    stockId={stock._id}
                    onStatusChange={handleStatusChange}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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

    if (filteredStocks.length === 0) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center bg-gray-50 p-8 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Matching Stocks</h3>
            <p className="text-gray-600">
              No stocks match your current search criteria. Try adjusting your filters or search query.
            </p>
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
            {activeFilters.length > 0 || searchQuery
              ? `${filteredStocks.length} stocks found ${searchQuery ? `matching "${searchQuery}"` : ''} ${
                  activeFilters.length > 0 ? `with ${activeFilters.length} filters` : ''
                }`
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
      
      <SearchBar searchQuery={searchQuery} handleSearch={handleSearch} />
      <FilterBar 
        filterLabels={FILTER_LABELS}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        setCurrentPage={setCurrentPage}
      />
      {renderContent()}
    </DashboardLayout>
  );
};

export default StocksPage;

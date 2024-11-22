import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stocks.map((stock) => (
          <div key={stock._id.$oid} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600">{stock.ticker}</h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {stock.metadata?.status || 'Unknown'}
              </span>
            </div>
            
            <h3 className="text-lg text-gray-700 mb-4">{stock.company}</h3>
            
            <div className="mb-4">
              <div className="text-lg font-semibold mb-2">Lynch Score</div>
              <div className="text-3xl font-bold text-blue-500">
                {getNumberValue(stock.analysis, 'lynchScore').toFixed(2)}
              </div>
            </div>

            <div className="mb-4">
              <div className="font-semibold mb-2">Analysis Reasons</div>
              <ul className="list-disc list-inside space-y-1">
                {stock.analysis?.reasons?.map((reason, index) => (
                  <li key={index} className="text-gray-600">{reason}</li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <div className="font-semibold mb-2">Classifications</div>
              <div className="flex flex-wrap gap-2">
                {stock.analysis?.classifications?.map((classification, index) => (
                  <div key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {classification.type}: {classification.details}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">PEG Ratio</div>
                <div className="font-semibold">
                  {getNumberValue(stock.metrics, 'pegRatio').toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Earnings Growth</div>
                <div className="font-semibold">
                  {(getNumberValue(stock.metrics, 'earningsGrowth') * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Institutional Ownership</div>
                <div className="font-semibold">
                  {(getNumberValue(stock.metrics, 'institutionalOwnership') * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Profit Margins</div>
                <div className="font-semibold">
                  {(getNumberValue(stock.metrics, 'profitMargins') * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stock Analysis</h1>
        <p className="mt-2 text-gray-600">View and analyze stock performance metrics</p>
      </div>
      {renderContent()}
    </DashboardLayout>
  );
}

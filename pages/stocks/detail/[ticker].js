import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import StockChart from '../../../components/StockChart';

export default function StockDetail() {
  const router = useRouter();
  const { ticker } = router.query;
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ticker) {
      fetchHistoricalData();
    }
  }, [ticker]);

  const fetchHistoricalData = async () => {
    try {
      const response = await fetch(`/api/historical-price?ticker=${ticker}`);
      const data = await response.json();
      setHistoricalData(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch historical data');
      setLoading(false);
    }
  };

  if (router.isFallback || !ticker) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Stock Detail: {ticker}</h1>
        <p className="text-lg text-gray-700 mb-6">Hello {ticker}! Welcome to the stock detail page.</p>
        
        {loading ? (
          <div className="animate-pulse bg-gray-200 rounded h-[400px]"></div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow">
            <StockChart data={historicalData} />
          </div>
        )}

        <button 
          onClick={() => router.back()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to List
        </button>
      </div>
    </DashboardLayout>
  );
}
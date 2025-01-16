import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

export default function StockDetail() {
  const router = useRouter();
  const { ticker } = router.query;
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchStockDetails = async () => {
      try {
        const response = await fetch(`/api/stock-details/${ticker}`);
        if (!response.ok) throw new Error('Failed to fetch stock details');
        const data = await response.json();
        setStock(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetails();
  }, [ticker]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    </DashboardLayout>
  );

  if (!stock) return null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stock.ticker}</h1>
            <p className="text-xl text-gray-600">{stock.company}</p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-600">Lynch Score</p>
            <p className="text-2xl font-bold text-blue-600">
              {stock.analysis?.lynchScore?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Analysis Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Analysis</h2>
            <div className="space-y-4">
              {stock.analysis?.reasons?.map((reason, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">PEG Ratio</p>
                <p className="text-lg font-semibold">
                  {stock.metrics?.pegRatio?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Insider Holdings</p>
                <p className="text-lg font-semibold">
                  {(stock.metrics?.insiderHoldings * 100)?.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Debt/Equity</p>
                <p className="text-lg font-semibold">
                  {stock.metrics?.debtEquity?.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Earnings Growth</p>
                <p className="text-lg font-semibold">
                  {(stock.metrics?.earningsGrowth * 100)?.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit Margins</p>
                <p className="text-lg font-semibold">
                  {(stock.metrics?.profitMargins * 100)?.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Institutional Ownership</p>
                <p className="text-lg font-semibold">
                  {(stock.metrics?.institutionalOwnership * 100)?.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Classifications Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Classifications</h2>
            <div className="space-y-4">
              {stock.analysis?.classifications?.map((classification, index) => (
                <div key={index} className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold text-blue-900">{classification.type}</p>
                  <p className="text-blue-700 text-sm mt-1">{classification.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Last Updated</span>
                <span className="font-medium">
                  {new Date(stock.metadata?.lastUpdated).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status</span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {stock.metadata?.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          ← Back to Stocks
        </button>
      </div>
    </DashboardLayout>
  );
} 
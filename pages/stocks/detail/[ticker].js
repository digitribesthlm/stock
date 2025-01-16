import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

export default function StockDetail() {
  const router = useRouter();
  const { ticker } = router.query;

  console.log('Ticker:', ticker); // Debug

  // If the page is not yet generated, this will be displayed
  // initially until getInitialProps completes
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
        <p className="text-lg text-gray-700">Hello {ticker}! Welcome to the stock detail page.</p>
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
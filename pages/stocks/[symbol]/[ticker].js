import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

export default function StockDetail() {
  const router = useRouter();
  const { symbol, ticker } = router.query;

  console.log('Symbol:', symbol); // Debug
  console.log('Ticker:', ticker); // Debug

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Stock Detail: {ticker}</h1>
        <p>Hello World - Stock Detail View</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to List
        </button>
      </div>
    </DashboardLayout>
  );
} 
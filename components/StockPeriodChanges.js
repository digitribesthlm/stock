// components/StockPeriodChanges.js
import React from 'react';

export default function StockPeriodChanges({ periodChanges }) {
  if (!periodChanges) return null;

  const formatPrice = (price) => `$${price.toFixed(2)}`;
  const formatDate = (isoDateStr) => {
    const date = new Date(isoDateStr);
    // Explicitly use the date's components to create the string
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const renderPeriodChange = (period, data) => {
    const isPositive = data.change > 0;
    const changeClass = isPositive ? 'text-green-600' : 'text-red-600';
    const changeIcon = isPositive ? '↑' : '↓';

    return (
      <div key={period} className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold mb-2">
          {period === '14d' ? '14 Days' : period === '30d' ? '30 Days' : '90 Days'}
        </h3>
        <div className={`text-2xl font-bold ${changeClass} mb-2`}>
          {changeIcon} {Math.abs(data.change).toFixed(2)}%
        </div>
        <div className="text-sm text-gray-600">
          <div>From: {formatPrice(data.startPrice)} ({formatDate(data.startDate)})</div>
          <div>To: {formatPrice(data.endPrice)} ({formatDate(data.endDate)})</div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Object.entries(periodChanges).map(([period, data]) => 
        renderPeriodChange(period, data)
      )}
    </div>
  );
}

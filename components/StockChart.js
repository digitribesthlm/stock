// components/StockChart.js
import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function StockChart({ data, metadata }) {
  const [showNormalized, setShowNormalized] = useState(true);

  // Add null checks
  if (!data || !metadata) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <p className="text-gray-500">Loading chart data...</p>
      </div>
    );
  }

  const formatDate = (isoDateStr) => {
    const date = new Date(isoDateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const chartData = {
    labels: data.map(item => formatDate(item.date)),
    datasets: [
      {
        label: `${metadata.stockSymbol} ${showNormalized ? '(Normalized)' : '(Price)'}`,
        data: data.map(item => showNormalized ? item.stockNormalized : item.stockPrice),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
      {
        label: `NASDAQ ${showNormalized ? '(Normalized)' : '(Price)'}`,
        data: data.map(item => showNormalized ? item.nasdaqNormalized : item.nasdaqPrice),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
      }
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: showNormalized 
          ? 'Stock Performance vs NASDAQ (Starting at 100)' 
          : 'Price History Comparison',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${showNormalized ? value.toFixed(2) + '%' : '$' + value.toFixed(2)}`;
          },
          title: (tooltipItems) => {
            return formatDate(data[tooltipItems[0].dataIndex].date);
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: showNormalized ? 'Relative Performance (%)' : 'Price ($)'
        }
      },
    },
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowNormalized(!showNormalized)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm"
        >
          {showNormalized ? 'Show Actual Prices' : 'Show Normalized Values'}
        </button>
      </div>
      <div className="h-[400px]">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}

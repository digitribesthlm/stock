import React, { useState } from 'react';

export default function DisruptionAnalysis({ ticker, companyName, sector }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'text-green-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'low':
        return 'text-orange-600';
      case 'none':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getOverallLevelColor = (level) => {
    if (level >= 4) return 'text-green-600';
    if (level >= 3) return 'text-yellow-600';
    if (level >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const analyzeDisruption = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-disruption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          companyName,
          sector
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze disruption');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisSection = (title, data) => (
    <div className="mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className={`font-bold ${getLevelColor(data.level)}`}>
          {data.level}
        </span>
      </div>
      <p className="text-gray-600 mt-1">{data.explanation}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      {!analysis ? (
        <div className="text-center">
          <button
            onClick={analyzeDisruption}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            Analyze Disruption Potential
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Disruption Analysis</h2>
            <p className="text-gray-600">
              Analysis for {analysis.company_info.name} ({analysis.company_info.ticker})
            </p>
          </div>

          {renderAnalysisSection('Technological Disruption', analysis.disruption_analysis.technological)}
          {renderAnalysisSection('Market Disruption', analysis.disruption_analysis.market)}
          {renderAnalysisSection('Value Chain', analysis.disruption_analysis.value_chain)}
          {renderAnalysisSection('Customer Experience', analysis.disruption_analysis.customer_experience)}
          {renderAnalysisSection('Regulatory/Policy', analysis.disruption_analysis.regulatory)}

          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Overall Disruption Level</h3>
              <span className={`text-2xl font-bold ${getOverallLevelColor(analysis.overall_assessment.disruption_level)}`}>
                {analysis.overall_assessment.disruption_level}/5
              </span>
            </div>
            <p className="text-gray-600 mt-2">{analysis.overall_assessment.explanation}</p>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Analysis performed on: {new Date(analysis.metadata.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';

export default function DisruptionSummary({ analysis }) {
  if (!analysis) return null;

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

  const getOverallScoreColor = (score) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    if (score >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm">
      <h3 className="font-bold border-b pb-1 mb-2">Disruption Analysis</h3>
      
      <div className="space-y-1.5">
        {Object.entries(analysis.categories).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
            <span className={`font-semibold ${getLevelColor(value.level)}`}>
              {value.level}
            </span>
          </div>
        ))}
        
        <div className="mt-2 pt-1 border-t">
          <div className="flex items-center justify-between font-medium">
            <span className="text-gray-600">Overall Score:</span>
            <span className={`${getOverallScoreColor(analysis.overallDisruption.score)}`}>
              {analysis.overallDisruption.score}/{analysis.overallDisruption.maxScore}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Last updated: {new Date(analysis.analysisDate).toLocaleDateString()}
      </div>
    </div>
  );
}

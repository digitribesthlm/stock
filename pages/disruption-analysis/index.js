import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

// Modal component for displaying detailed analysis
function DisruptionModal({ analysis, onClose }) {
  if (!analysis) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{analysis.ticker}</h2>
              <p className="text-gray-600">{analysis.company}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Overall Disruption Score */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Overall Disruption Score</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.overallDisruption.score}/{analysis.overallDisruption.maxScore}
                </div>
              </div>
              <p className="text-blue-800">{analysis.overallDisruption.description}</p>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysis.categories).map(([category, data]) => (
                <div key={category} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 capitalize mb-2">
                    {category} Disruption
                  </h4>
                  <div className="mb-2">
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      data.level === 'High' ? 'bg-green-100 text-green-800' :
                      data.level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      data.level === 'Low' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {data.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{data.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DisruptionAnalysis() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/disruption-analyses');
        if (!response.ok) throw new Error('Failed to fetch analyses');
        const data = await response.json();
        setAnalyses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600 p-4">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Disruption Analysis</h1>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analysis Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyses.map((analysis) => (
                  <tr 
                    key={analysis._id.$oid} 
                    onClick={() => setSelectedAnalysis(analysis)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {analysis.ticker}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analysis.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(analysis.analysisDate.$date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${getScoreColor(analysis.overallDisruption.score, analysis.overallDisruption.maxScore)}`}>
                        {analysis.overallDisruption.score}/{analysis.overallDisruption.maxScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1">
                        {Object.entries(analysis.categories).map(([category, data]) => (
                          <span
                            key={category}
                            className={`inline-block px-2 py-1 rounded-full text-xs ${
                              data.level === 'High' ? 'bg-green-100 text-green-800' :
                              data.level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                              data.level === 'Low' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {data.level[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedAnalysis && (
          <DisruptionModal
            analysis={selectedAnalysis}
            onClose={() => setSelectedAnalysis(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

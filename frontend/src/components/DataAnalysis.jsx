import React from 'react';

const DataAnalysis = ({ analysis, onAnalyze, rawData, cleanedData }) => {
  // Function to get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'info':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!analysis) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {cleanedData ? 'Post-Cleaning Data Quality Analysis' : 'Pre-Cleaning Data Quality Analysis'}
          </h2>
          <button
            onClick={onAnalyze}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none"
          >
            {cleanedData ? 'Analyze Cleaned Data' : 'Analyze Raw Data'}
          </button>
        </div>
        <p className="text-gray-600">
          {cleanedData 
            ? 'Analyze your cleaned dataset to see the quality improvements.' 
            : 'Analyze your raw dataset to identify potential data quality issues before cleaning.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {analysis.is_cleaned ? 'Post-Cleaning Data Quality Analysis' : 'Pre-Cleaning Data Quality Analysis'}
        </h2>
        <button
          onClick={onAnalyze}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none"
        >
          Re-analyze
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800">Dataset Overview</h3>
          <p className="text-blue-600">{analysis.total_rows} rows</p>
          <p className="text-blue-600">{analysis.total_columns} columns</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-purple-800">Issues Found</h3>
          <p className="text-3xl font-bold text-purple-600">{analysis.issues_found}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-800">Status</h3>
          <p className="text-green-600">
            {analysis.issues_found === 0 ? 'No issues detected' : 'Issues detected'}
          </p>
        </div>
      </div>

      {analysis.issues_found > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Issues Report</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recommendation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysis.analysis_report.map((issue, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {issue.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {issue.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analysis.issues_found === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">No issues detected</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  {analysis.is_cleaned 
                    ? 'Your cleaned dataset is in excellent condition with no major issues detected.' 
                    : 'Your raw dataset appears to be in good condition with no major issues detected.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {analysis.is_cleaned && rawData && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Data Quality Improvement</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You've successfully cleaned your data! The post-cleaning analysis shows the current state of your dataset quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnalysis;
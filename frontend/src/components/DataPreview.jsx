import React from 'react';

const DataPreview = ({ rawData, cleanedData, columns, onCleanOptions, onRunCleaning, downloadUrls, loading }) => {
  const data = cleanedData || rawData;
  
  if (!data) return null;

  // Function to safely convert any value to string for display
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {cleanedData ? 'Cleaned Data Preview' : 'Raw Data Preview'}
        </h2>
        {!cleanedData ? (
          <button
            type="button"
            onClick={onCleanOptions}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none"
          >
            Clean Data Options
          </button>
        ) : (
          <div className="flex space-x-2">
            <a
              href={`http://localhost:8000${downloadUrls.csv}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
            >
              Download CSV
            </a>
            <a
              href={`http://localhost:8000${downloadUrls.xlsx}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Download Excel
            </a>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rawData && !cleanedData && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onRunCleaning}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Cleaning...' : 'Run Cleaning'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DataPreview;
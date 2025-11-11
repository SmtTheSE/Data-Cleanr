import React from 'react';

const CleanOptionsModal = ({ isOpen, onClose, options, onOptionChange, onRunCleaning, loading, industryInfo }) => {
  if (!isOpen) return null;

  const handleRun = () => {
    onRunCleaning();
    onClose();
  };

  // Group options by category
  const generalOptions = [
    { id: 'removeDuplicates', label: 'Remove Duplicates' },
    { id: 'harmonizeColumns', label: 'Harmonize Column Names (lowercase, underscores)' },
    { id: 'trimWhitespace', label: 'Trim Whitespace' },
    { id: 'standardizeDates', label: 'Standardize Date Formats' },
    { id: 'reorderColumns', label: 'Reorder Columns Alphabetically' }
  ];

  const missingValueOptions = [
    { id: 'none', label: 'None' },
    { id: 'drop', label: 'Drop Rows' },
    { id: 'fill_mean', label: 'Fill with Mean' },
    { id: 'fill_zero', label: 'Fill with Zero' }
  ];

  // Industry-specific options grouped by sector
  const industryOptions = {
    retail: [
      { id: 'deduplicateCustomers', label: 'Deduplicate Customers' },
      { id: 'standardizeAddresses', label: 'Standardize Addresses' },
      { id: 'normalizePhoneNumbers', label: 'Normalize Phone Numbers' }
    ],
    finance: [
      { id: 'validateAccounts', label: 'Validate Accounts' },
      { id: 'detectFraudPatterns', label: 'Detect Fraud Patterns' },
      { id: 'standardizeTransactions', label: 'Standardize Transactions' }
    ],
    healthcare: [
      { id: 'anonymizeData', label: 'Anonymize Data (HIPAA)' },
      { id: 'standardizeMedicalCodes', label: 'Standardize Medical Codes' },
      { id: 'validateDemographics', label: 'Validate Demographics' }
    ],
    manufacturing: [
      { id: 'smoothSensorData', label: 'Smooth Sensor Data' },
      { id: 'standardizeUnits', label: 'Standardize Units' },
      { id: 'interpolateDowntime', label: 'Interpolate Downtime' }
    ],
    demandPlanning: [
      { id: 'fillTimeGaps', label: 'Fill Time Gaps' },
      { id: 'adjustSeasonality', label: 'Adjust Seasonality' },
      { id: 'normalizePromotions', label: 'Normalize Promotions' }
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Data Cleaning Options</h3>
          {industryInfo && (
            <p className="text-sm text-gray-500 mt-1">
              Industry: {industryInfo.industry} | {industryInfo.description}
            </p>
          )}
        </div>
        
        <div className="px-6 py-4 space-y-6">
          {/* General Options */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">General Cleaning Options</h4>
            <div className="space-y-3">
              {generalOptions.map(option => (
                <div key={option.id} className="flex items-center">
                  <input
                    id={option.id}
                    type="checkbox"
                    checked={options[option.id]}
                    onChange={(e) => onOptionChange(option.id, e.target.checked)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor={option.id} className="ml-2 block text-sm text-gray-900">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Missing Values */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Handle Missing Values</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {missingValueOptions.map(option => (
                <div key={option.id} className="flex items-center">
                  <input
                    id={`missing${option.id.charAt(0).toUpperCase() + option.id.slice(1)}`}
                    type="radio"
                    name="handleMissing"
                    checked={options.handleMissing === option.id}
                    onChange={() => onOptionChange('handleMissing', option.id)}
                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <label htmlFor={`missing${option.id.charAt(0).toUpperCase() + option.id.slice(1)}`} className="ml-2 block text-sm text-gray-900">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Industry-Specific Options */}
          {industryInfo && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">
                Industry-Specific Options for {industryInfo.industry}
              </h4>
              <div className="space-y-4">
                {/* Retail Options */}
                {industryInfo.industry.includes('Retail') && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">Retail/E-commerce</h5>
                    <div className="space-y-3">
                      {industryOptions.retail.map(option => (
                        <div key={option.id} className="flex items-center">
                          <input
                            id={option.id}
                            type="checkbox"
                            checked={options[option.id]}
                            onChange={(e) => onOptionChange(option.id, e.target.checked)}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <label htmlFor={option.id} className="ml-2 block text-sm text-gray-900">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Finance Options */}
                {industryInfo.industry.includes('Finance') && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">Finance/Banking</h5>
                    <div className="space-y-3">
                      {industryOptions.finance.map(option => (
                        <div key={option.id} className="flex items-center">
                          <input
                            id={option.id}
                            type="checkbox"
                            checked={options[option.id]}
                            onChange={(e) => onOptionChange(option.id, e.target.checked)}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <label htmlFor={option.id} className="ml-2 block text-sm text-gray-900">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Healthcare Options */}
                {industryInfo.industry.includes('Healthcare') && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">Healthcare</h5>
                    <div className="space-y-3">
                      {industryOptions.healthcare.map(option => (
                        <div key={option.id} className="flex items-center">
                          <input
                            id={option.id}
                            type="checkbox"
                            checked={options[option.id]}
                            onChange={(e) => onOptionChange(option.id, e.target.checked)}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <label htmlFor={option.id} className="ml-2 block text-sm text-gray-900">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Manufacturing Options */}
                {industryInfo.industry.includes('Manufacturing') && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">Manufacturing</h5>
                    <div className="space-y-3">
                      {industryOptions.manufacturing.map(option => (
                        <div key={option.id} className="flex items-center">
                          <input
                            id={option.id}
                            type="checkbox"
                            checked={options[option.id]}
                            onChange={(e) => onOptionChange(option.id, e.target.checked)}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <label htmlFor={option.id} className="ml-2 block text-sm text-gray-900">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Demand Planning Options */}
                {industryInfo.industry.includes('Demand') && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-2">Demand Planning</h5>
                    <div className="space-y-3">
                      {industryOptions.demandPlanning.map(option => (
                        <div key={option.id} className="flex items-center">
                          <input
                            id={option.id}
                            type="checkbox"
                            checked={options[option.id]}
                            onChange={(e) => onOptionChange(option.id, e.target.checked)}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <label htmlFor={option.id} className="ml-2 block text-sm text-gray-900">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Cleaning'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CleanOptionsModal;
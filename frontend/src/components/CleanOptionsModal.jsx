import React, { useState, useEffect } from 'react';

const CleanOptionsModal = ({ 
  isOpen, 
  onClose, 
  options, 
  onOptionChange, 
  onRunCleaning, 
  onIssueBasedCleaning,
  loading, 
  industryInfo, 
  dataAnalysis 
}) => {
  if (!isOpen) return null;

  const [selectedIssues, setSelectedIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('traditional'); // 'traditional' or 'issues'

  const handleRun = () => {
    if (activeTab === 'issues') {
      onIssueBasedCleaning(selectedIssues);
    } else {
      onRunCleaning();
    }
    onClose();
  };

  // Extract data quality issues from analysis
  const getDataQualityIssues = () => {
    if (!dataAnalysis || !dataAnalysis.analysis_report) return [];
    
    return dataAnalysis.analysis_report.map((issue, index) => ({
      id: `issue-${index}`,
      type: issue.type,
      description: issue.description,
      recommendation: issue.recommendation,
      severity: issue.severity,
      selected: false
    }));
  };

  const [dataQualityIssues, setDataQualityIssues] = useState([]);

  useEffect(() => {
    setDataQualityIssues(getDataQualityIssues());
  }, [dataAnalysis]);

  const toggleIssueSelection = (issueId) => {
    setSelectedIssues(prev => {
      if (prev.includes(issueId)) {
        return prev.filter(id => id !== issueId);
      } else {
        return [...prev, issueId];
      }
    });
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
    ],
    education: [
      { id: 'standardizeGrades', label: 'Standardize Grades' },
      { id: 'validateStudentIds', label: 'Validate Student IDs' },
      { id: 'harmonizeCourseCodes', label: 'Harmonize Course Codes' }
    ]
  };

  // Function to get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'info':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Function to get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Data Cleaning Options</h3>
              {industryInfo && (
                <p className="text-sm text-gray-600 mt-1">
                  Industry: <span className="font-semibold">{industryInfo.industry}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('traditional')}
              className={`flex-1 py-5 px-6 text-center font-bold text-sm relative ${
                activeTab === 'traditional'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Traditional Cleaning</span>
              {activeTab === 'traditional' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`flex-1 py-5 px-6 text-center font-bold text-sm relative ${
                activeTab === 'issues'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Issue-Based Cleaning</span>
              {activeTab === 'issues' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          </nav>
        </div>
        
        <div className="px-6 py-6 space-y-8">
          {/* Issue-Based Cleaning Tab */}
          {activeTab === 'issues' && (
            <div>
              <div className="mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Data Quality Issues</h4>
                <p className="text-gray-600">
                  Select specific data quality issues you want to address. You can apply these cleaning operations iteratively.
                </p>
              </div>
              
              {dataQualityIssues.length > 0 ? (
                <div className="space-y-4">
                  {dataQualityIssues.map((issue) => (
                    <div key={issue.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start">
                          <div className="flex items-center h-5 pt-0.5">
                            <input
                              id={issue.id}
                              type="checkbox"
                              checked={selectedIssues.includes(issue.id)}
                              onChange={() => toggleIssueSelection(issue.id)}
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center">
                              <div className={`flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(issue.severity)}`}>
                                {getSeverityIcon(issue.severity)}
                                <span className="ml-1.5">{issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}</span>
                              </div>
                              <label htmlFor={issue.id} className="ml-3 block text-base font-bold text-gray-900">
                                {issue.description}
                              </label>
                            </div>
                            <p className="mt-3 text-gray-600">{issue.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 text-center">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-green-100 rounded-full blur opacity-75"></div>
                      <div className="relative bg-white rounded-full p-2">
                        <svg className="h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h4 className="mt-4 text-xl font-bold text-green-800">No data quality issues detected</h4>
                  <p className="mt-2 text-green-700">Your dataset looks clean and ready for analysis!</p>
                </div>
              )}
            </div>
          )}
          
          {/* Traditional Cleaning Tab */}
          {activeTab === 'traditional' && (
            <>
              {/* General Options */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h4 className="text-xl font-bold text-gray-900">General Cleaning Options</h4>
                </div>
                <div className="p-6 space-y-4">
                  {generalOptions.map(option => (
                    <div key={option.id} className="flex items-center">
                      <input
                        id={option.id}
                        type="checkbox"
                        checked={options[option.id]}
                        onChange={(e) => onOptionChange(option.id, e.target.checked)}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor={option.id} className="ml-3 block text-base font-medium text-gray-900">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Missing Values */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h4 className="text-xl font-bold text-gray-900">Handle Missing Values</h4>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {missingValueOptions.map(option => (
                      <div key={option.id} className="flex items-center">
                        <input
                          id={`missing${option.id.charAt(0).toUpperCase() + option.id.slice(1)}`}
                          type="radio"
                          name="handleMissing"
                          checked={options.handleMissing === option.id}
                          onChange={() => onOptionChange('handleMissing', option.id)}
                          className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor={`missing${option.id.charAt(0).toUpperCase() + option.id.slice(1)}`} className="ml-3 block text-base font-medium text-gray-900">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Industry-Specific Options */}
              {industryInfo && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h4 className="text-xl font-bold text-gray-900">
                      Industry-Specific Options for {industryInfo.industry}
                    </h4>
                    <p className="mt-1 text-gray-600">{industryInfo.description}</p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Retail Options */}
                    {industryInfo.industry.includes('Retail') && (
                      <div className="border border-gray-200 rounded-xl p-5">
                        <h5 className="text-lg font-bold text-gray-800 mb-4">Retail/E-commerce</h5>
                        <div className="space-y-4">
                          {industryOptions.retail.map(option => (
                            <div key={option.id} className="flex items-center">
                              <input
                                id={option.id}
                                type="checkbox"
                                checked={options[option.id]}
                                onChange={(e) => onOptionChange(option.id, e.target.checked)}
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <label htmlFor={option.id} className="ml-3 block text-base font-medium text-gray-900">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Finance Options */}
                    {industryInfo.industry.includes('Finance') && (
                      <div className="border border-gray-200 rounded-xl p-5">
                        <h5 className="text-lg font-bold text-gray-800 mb-4">Finance/Banking</h5>
                        <div className="space-y-4">
                          {industryOptions.finance.map(option => (
                            <div key={option.id} className="flex items-center">
                              <input
                                id={option.id}
                                type="checkbox"
                                checked={options[option.id]}
                                onChange={(e) => onOptionChange(option.id, e.target.checked)}
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <label htmlFor={option.id} className="ml-3 block text-base font-medium text-gray-900">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Healthcare Options */}
                    {industryInfo.industry.includes('Healthcare') && (
                      <div className="border border-gray-200 rounded-xl p-5">
                        <h5 className="text-lg font-bold text-gray-800 mb-4">Healthcare</h5>
                        <div className="space-y-4">
                          {industryOptions.healthcare.map(option => (
                            <div key={option.id} className="flex items-center">
                              <input
                                id={option.id}
                                type="checkbox"
                                checked={options[option.id]}
                                onChange={(e) => onOptionChange(option.id, e.target.checked)}
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <label htmlFor={option.id} className="ml-3 block text-base font-medium text-gray-900">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Manufacturing Options */}
                    {industryInfo.industry.includes('Manufacturing') && (
                      <div className="border border-gray-200 rounded-xl p-5">
                        <h5 className="text-lg font-bold text-gray-800 mb-4">Manufacturing</h5>
                        <div className="space-y-4">
                          {industryOptions.manufacturing.map(option => (
                            <div key={option.id} className="flex items-center">
                              <input
                                id={option.id}
                                type="checkbox"
                                checked={options[option.id]}
                                onChange={(e) => onOptionChange(option.id, e.target.checked)}
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <label htmlFor={option.id} className="ml-3 block text-base font-medium text-gray-900">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Demand Planning Options */}
                    {industryInfo.industry.includes('Demand') && (
                      <div className="border border-gray-200 rounded-xl p-5">
                        <h5 className="text-lg font-bold text-gray-800 mb-4">Demand Planning</h5>
                        <div className="space-y-4">
                          {industryOptions.demandPlanning.map(option => (
                            <div key={option.id} className="flex items-center">
                              <input
                                id={option.id}
                                type="checkbox"
                                checked={options[option.id]}
                                onChange={(e) => onOptionChange(option.id, e.target.checked)}
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <label htmlFor={option.id} className="ml-3 block text-base font-medium text-gray-900">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Education Options */}
                    {industryInfo.industry.includes('Education') && (
                      <div className="border border-gray-200 rounded-xl p-5">
                        <h5 className="text-lg font-bold text-gray-800 mb-4">Education</h5>
                        <div className="space-y-4">
                          {industryOptions.education.map(option => (
                            <div key={option.id} className="flex items-center">
                              <input
                                id={option.id}
                                type="checkbox"
                                checked={options[option.id]}
                                onChange={(e) => onOptionChange(option.id, e.target.checked)}
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <label htmlFor={option.id} className="ml-3 block text-base font-medium text-gray-900">
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
            </>
          )}
        </div>
        
        <div className="px-6 py-5 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-5 py-3 border border-gray-300 text-base font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={loading || (activeTab === 'issues' && selectedIssues.length === 0)}
            className="inline-flex items-center px-5 py-3 border border-transparent text-base font-bold rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running...
              </>
            ) : (
              activeTab === 'issues' ? 'Apply Selected Issues' : 'Run Cleaning'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CleanOptionsModal;
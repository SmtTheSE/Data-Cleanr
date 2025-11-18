import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataPreview from './components/DataPreview';
import CleanOptionsModal from './components/CleanOptionsModal';
import FileUploader from './components/FileUploader';
import DataAnalysis from './components/DataAnalysis';
import Visualization from './components/Visualization';
import LandingPage from './components/LandingPage';

const api = axios.create({
  baseURL: 'http://localhost:8000'
});

// Add a separate instance with longer timeout for file uploads
const uploadApi = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 300000, // 5 minutes timeout for large file uploads
});

// Session storage keys
const SESSION_KEYS = {
  FILE_ID: 'datacleanr_fileId',
  RAW_DATA: 'datacleanr_rawData',
  CLEANED_DATA: 'datacleanr_cleanedData',
  COLUMNS: 'datacleanr_columns',
  INDUSTRY_INFO: 'datacleanr_industryInfo',
  CLEAN_OPTIONS: 'datacleanr_cleanOptions',
  DOWNLOAD_URLS: 'datacleanr_downloadUrls'
};

function App() {
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [fileId, setFileId] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [cleanedData, setCleanedData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCleanOptions, setShowCleanOptions] = useState(false);
  const [cleanOptions, setCleanOptions] = useState({
    removeDuplicates: false,
    harmonizeColumns: false,
    handleMissing: 'none',
    trimWhitespace: false,
    standardizeDates: false,
    reorderColumns: false,
    // Industry-specific options
    deduplicateCustomers: false,
    standardizeAddresses: false,
    normalizePhoneNumbers: false,
    validateAccounts: false,
    detectFraudPatterns: false,
    standardizeTransactions: false,
    anonymizeData: false,
    standardizeMedicalCodes: false,
    validateDemographics: false,
    smoothSensorData: false,
    standardizeUnits: false,
    interpolateDowntime: false,
    fillTimeGaps: false,
    adjustSeasonality: false,
    normalizePromotions: false,
    standardizeGrades: false,
    validateStudentIds: false,
    harmonizeCourseCodes: false
  });
  const [downloadUrls, setDownloadUrls] = useState({ csv: null, xlsx: null });
  const [industryInfo, setIndustryInfo] = useState(null);
  const [dataAnalysis, setDataAnalysis] = useState(null);

  // Load session data on component mount
  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = () => {
    try {
      const savedFileId = localStorage.getItem(SESSION_KEYS.FILE_ID);
      const savedRawData = JSON.parse(localStorage.getItem(SESSION_KEYS.RAW_DATA));
      const savedCleanedData = JSON.parse(localStorage.getItem(SESSION_KEYS.CLEANED_DATA));
      const savedColumns = JSON.parse(localStorage.getItem(SESSION_KEYS.COLUMNS));
      const savedIndustryInfo = JSON.parse(localStorage.getItem(SESSION_KEYS.INDUSTRY_INFO));
      const savedCleanOptions = JSON.parse(localStorage.getItem(SESSION_KEYS.CLEAN_OPTIONS));
      const savedDownloadUrls = JSON.parse(localStorage.getItem(SESSION_KEYS.DOWNLOAD_URLS));
      const hasEnteredApp = localStorage.getItem('datacleanr_hasEnteredApp');

      if (savedFileId) {
        // Check if the file ID is still valid on the backend
        validateFileId(savedFileId)
          .then(isValid => {
            if (isValid) {
              setShowLandingPage(false);
              setFileId(savedFileId);
              if (savedRawData) setRawData(savedRawData);
              if (savedCleanedData) setCleanedData(savedCleanedData);
              if (savedColumns) setColumns(savedColumns);
              if (savedIndustryInfo) setIndustryInfo(savedIndustryInfo);
              if (savedCleanOptions) setCleanOptions(savedCleanOptions);
              if (savedDownloadUrls) setDownloadUrls(savedDownloadUrls);
            } else {
              // Clear invalid session data
              clearSessionData();
            }
          })
          .catch(() => {
            // If we can't validate, assume it's invalid
            clearSessionData();
          });
      } else if (!hasEnteredApp) {
        // Only show landing page if user hasn't entered the app before
        setShowLandingPage(true);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      clearSessionData();
    }
  };

  // Function to validate if a file ID still exists on the backend
  const validateFileId = async (fileId) => {
    try {
      // We'll use a simple request to check if the file ID exists
      // Since there's no specific endpoint for this, we'll try to get suggestions
      // which will fail if the file ID doesn't exist
      const formData = new FormData();
      formData.append('file_id', fileId);
      await api.post('/api/suggest', formData);
      return true;
    } catch (error) {
      // If we get a 404, the file ID is not valid
      if (error.response?.status === 404) {
        return false;
      }
      // For other errors (network issues, etc.), assume it's valid for now
      return true;
    }
  };

  const clearSessionData = () => {
    Object.values(SESSION_KEYS).forEach(key => localStorage.removeItem(key));
    setFileId(null);
    setRawData(null);
    setCleanedData(null);
    setColumns([]);
    setIndustryInfo(null);
    setDownloadUrls({ csv: null, xlsx: null });
    // Reset cleanOptions to defaults
    setCleanOptions({
      removeDuplicates: false,
      harmonizeColumns: false,
      handleMissing: 'none',
      trimWhitespace: false,
      standardizeDates: false,
      reorderColumns: false,
      // Industry-specific options
      deduplicateCustomers: false,
      standardizeAddresses: false,
      normalizePhoneNumbers: false,
      validateAccounts: false,
      detectFraudPatterns: false,
      standardizeTransactions: false,
      anonymizeData: false,
      standardizeMedicalCodes: false,
      validateDemographics: false,
      smoothSensorData: false,
      standardizeUnits: false,
      interpolateDowntime: false,
      fillTimeGaps: false,
      adjustSeasonality: false,
      normalizePromotions: false,
      standardizeGrades: false,
      validateStudentIds: false,
      harmonizeCourseCodes: false
    });
    // Don't automatically show landing page - user must click Home button
  };

  const handleStartCleaning = () => {
    setShowLandingPage(false);
    // Save to localStorage that user has entered the app
    localStorage.setItem('datacleanr_hasEnteredApp', 'true');
  };

  const handleFileUpload = async (file) => {
    // Clear previous session when uploading new file
    clearSessionData();

    // Set that we've entered the app
    localStorage.setItem('datacleanr_hasEnteredApp', 'true');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      // Use the uploadApi instance with longer timeout for file uploads
      const response = await uploadApi.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFileId(response.data.file_id);
      setRawData(response.data.preview);
      setColumns(response.data.columns);
      setCleanedData(null);
      setDownloadUrls({ csv: null, xlsx: null });
      setIndustryInfo(null);
      setDataAnalysis(null);
      setShowLandingPage(false);
    } catch (error) {
      console.error('Upload failed:', error);
      // Check if it's a network error or timeout
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        alert('Upload timed out. This might be due to a large file. Please try again or use a smaller file.');
      } else {
        alert('Upload failed: ' + (error.response?.data?.detail || error.message || 'Unknown error occurred'));
      }
      // Prevent redirect to landing page on upload errors
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeData = async () => {
    if (!fileId) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file_id', fileId);
      
      const response = await api.post('/api/analyze', formData);
      setDataAnalysis(response.data);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Check if it's a file not found error
      if (error.response?.status === 404) {
        alert('Your session has expired. Please upload your file again.');
        clearSessionData();
      } else {
        alert('Analysis failed: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestCleaning = async () => {
    if (!fileId) return;

    try {
      setLoading(true);
      
      // First, detect the industry
      const industryFormData = new FormData();
      industryFormData.append('file_id', fileId);
      const industryResponse = await api.post('/api/detect-industry', industryFormData);
      setIndustryInfo(industryResponse.data);
      
      // Then get cleaning suggestions
      const formData = new FormData();
      formData.append('file_id', fileId);
      
      const response = await api.post('/api/industry-suggestions', formData);
      
      const suggestions = response.data.suggestions.reduce((acc, suggestion) => {
        // Convert snake_case to camelCase for the state keys
        const camelCaseKey = suggestion.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        acc[camelCaseKey] = true;
        return acc;
      }, {});
      
      setCleanOptions(prev => ({ ...prev, ...suggestions }));
      setShowCleanOptions(true);
    } catch (error) {
      console.error('Suggestion failed:', error);
      // Check if it's a file not found error
      if (error.response?.status === 404) {
        alert('Your session has expired. Please upload your file again.');
        clearSessionData();
      } else {
        alert('Suggestion failed: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIssueBasedCleaning = async (selectedIssues) => {
    if (!fileId || !dataAnalysis) return;

    try {
      setLoading(true);
      const requestData = {
        file_id: fileId,
        selected_issues: selectedIssues,
        analysis_report: dataAnalysis.analysis_report
      };

      const response = await api.post('/api/clean-issues', requestData);
      
      // Update the cleaned data
      setCleanedData(response.data.preview);
      setColumns(response.data.columns);
      setDownloadUrls(response.data.download_urls);
      
      // Clear any previous analysis and trigger a new analysis of the cleaned data
      setDataAnalysis(null);
    } catch (error) {
      console.error('Issue-based cleaning failed:', error);
      // Check if it's a file not found error
      if (error.response?.status === 404) {
        alert('Your session has expired. Please upload your file again.');
        clearSessionData();
      } else {
        alert('Cleaning failed: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunCleaning = async () => {
    if (!fileId) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file_id', fileId);
      formData.append('remove_duplicates', cleanOptions.removeDuplicates);
      formData.append('harmonize_columns', cleanOptions.harmonizeColumns);
      formData.append('handle_missing', cleanOptions.handleMissing);
      formData.append('trim_whitespace', cleanOptions.trimWhitespace);
      formData.append('standardize_dates', cleanOptions.standardizeDates);
      formData.append('reorder_columns', cleanOptions.reorderColumns);
      
      // Industry-specific options
      formData.append('deduplicate_customers', cleanOptions.deduplicateCustomers);
      formData.append('standardize_addresses', cleanOptions.standardizeAddresses);
      formData.append('normalize_phone_numbers', cleanOptions.normalizePhoneNumbers);
      formData.append('validate_accounts', cleanOptions.validateAccounts);
      formData.append('detect_fraud_patterns', cleanOptions.detectFraudPatterns);
      formData.append('standardize_transactions', cleanOptions.standardizeTransactions);
      formData.append('anonymize_data', cleanOptions.anonymizeData);
      formData.append('standardize_medical_codes', cleanOptions.standardizeMedicalCodes);
      formData.append('validate_demographics', cleanOptions.validateDemographics);
      formData.append('smooth_sensor_data', cleanOptions.smoothSensorData);
      formData.append('standardize_units', cleanOptions.standardizeUnits);
      formData.append('interpolate_downtime', cleanOptions.interpolateDowntime);
      formData.append('fill_time_gaps', cleanOptions.fillTimeGaps);
      formData.append('adjust_seasonality', cleanOptions.adjustSeasonality);
      formData.append('normalize_promotions', cleanOptions.normalizePromotions);
      formData.append('standardize_grades', cleanOptions.standardizeGrades);
      formData.append('validate_student_ids', cleanOptions.validateStudentIds);
      formData.append('harmonize_course_codes', cleanOptions.harmonizeCourseCodes);

      const response = await api.post('/api/clean', formData);
      
      // Log the response for debugging
      console.log('Clean API Response:', response.data);

      setCleanedData(response.data.preview);
      setColumns(response.data.columns); // Update columns with cleaned data columns
      setDownloadUrls(response.data.download_urls);
      
      // Clear any previous analysis and trigger a new analysis of the cleaned data
      setDataAnalysis(null);
    } catch (error) {
      console.error('Cleaning failed:', error);
      // Check if it's a file not found error
      if (error.response?.status === 404) {
        alert('Your session has expired. Please upload your file again.');
        clearSessionData();
      } else {
        alert('Cleaning failed: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (option, value) => {
    setCleanOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  // Show landing page only if explicitly needed and user hasn't entered app
  const shouldShowLandingPage = showLandingPage && !rawData && !cleanedData;

  if (shouldShowLandingPage) {
    return <LandingPage onStartCleaning={handleStartCleaning} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <svg className="h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white"></div>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              DataCleanr
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {(rawData || cleanedData) && (
              <button
                onClick={clearSessionData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none transition-all duration-300"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Session
              </button>
            )}
            <button
              onClick={() => {
                setShowLandingPage(true);
                // Mark that user wants to go home (will show landing page)
                localStorage.removeItem('datacleanr_hasEnteredApp');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all duration-300"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {/* Industry Info Display */}
        {industryInfo && (
          <div className="px-4 py-2 sm:px-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-r-lg p-5 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-blue-800">Industry Detected</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-semibold">Industry:</span> {industryInfo.industry} 
                    {' '}<span className="font-semibold">(Confidence: {Math.round(industryInfo.confidence * 100)}%)</span>
                  </p>
                  {industryInfo.features.length > 0 && (
                    <p className="text-sm text-blue-700 mt-1">
                      <span className="font-semibold">Key Features:</span> {industryInfo.features.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Area */}
        <div className="px-4 py-6 sm:px-0">
          <FileUploader 
            onFileUpload={handleFileUpload} 
            loading={loading}
            onSuggestCleaning={handleSuggestCleaning}
            fileId={fileId}
          />
        </div>

        {/* Data Analysis Section */}
        {(rawData || cleanedData) && (
          <div className="px-4 py-6 sm:px-0">
            <DataAnalysis 
              analysis={dataAnalysis} 
              onAnalyze={handleAnalyzeData} 
              rawData={rawData}
              cleanedData={cleanedData}
            />
          </div>
        )}

        {/* Visualization Section */}
        {(rawData || cleanedData) && (
          <div className="px-4 py-6 sm:px-0">
            <Visualization 
              rawData={rawData}
              cleanedData={cleanedData}
            />
          </div>
        )}

        {/* Data Preview Section */}
        {(rawData || cleanedData) && (
          <div className="px-4 py-6 sm:px-0">
            <DataPreview 
              rawData={rawData}
              cleanedData={cleanedData}
              columns={columns}
              onCleanOptions={() => setShowCleanOptions(true)}
              onRunCleaning={handleRunCleaning}
              downloadUrls={downloadUrls}
              loading={loading}
            />
          </div>
        )}

        {/* Clean Options Modal */}
        {showCleanOptions && (
          <CleanOptionsModal 
            isOpen={showCleanOptions}
            onClose={() => setShowCleanOptions(false)}
            options={cleanOptions}
            onOptionChange={handleOptionChange}
            onRunCleaning={handleRunCleaning}
            onIssueBasedCleaning={handleIssueBasedCleaning}
            loading={loading}
            industryInfo={industryInfo}
            dataAnalysis={dataAnalysis}
          />
        )}
      </main>
    </div>
  );
}

export default App;
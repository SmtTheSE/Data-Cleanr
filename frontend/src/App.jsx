import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataPreview from './components/DataPreview';
import CleanOptionsModal from './components/CleanOptionsModal';
import FileUploader from './components/FileUploader';
import DataAnalysis from './components/DataAnalysis';
import Visualization from './components/Visualization';

const api = axios.create({
  baseURL: 'http://localhost:8000'
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
    normalizePromotions: false
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

      if (savedFileId) {
        // Check if the file ID is still valid on the backend
        validateFileId(savedFileId)
          .then(isValid => {
            if (isValid) {
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
      normalizePromotions: false
    });
  };

  const handleFileUpload = async (file) => {
    // Clear previous session when uploading new file
    clearSessionData();

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await api.post('/api/upload', formData, {
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
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">DataCleanr – Instant Data Cleaning for Data Scientists</h1>
          {(rawData || cleanedData) && (
            <button
              onClick={clearSessionData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            >
              Clear Session
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Industry Info Display */}
        {industryInfo && (
          <div className="px-4 py-2 sm:px-0">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Industry Detected:</span> {industryInfo.industry} 
                    {' '}<span className="font-medium">(Confidence: {Math.round(industryInfo.confidence * 100)}%)</span>
                  </p>
                  {industryInfo.features.length > 0 && (
                    <p className="text-sm text-blue-700 mt-1">
                      <span className="font-medium">Key Features:</span> {industryInfo.features.join(', ')}
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
            loading={loading}
            industryInfo={industryInfo}
          />
        )}
      </main>
    </div>
  );
}

export default App;
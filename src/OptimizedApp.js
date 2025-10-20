import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import FileUpload from './components/FileUpload';
import OptimizedDataTable from './components/OptimizedDataTable';
import AnalysisPanel from './components/AnalysisPanel';
import LanguageSelector from './components/LanguageSelector';
import DebugPage from './components/DebugPage';
import ModelSelector from './components/ModelSelector';
import ErrorBoundary from './components/ErrorBoundary';
import { parseExcelFile, exportToExcel } from './utils/optimizedExcelParser';
import { analyzeContent, translateBatchStructured, cancelTranslation, resetTranslationCancellation } from './utils/optimizedAiService';
import { API_ENDPOINTS } from './utils/constants';
import { FileSpreadsheet, Download, Globe, Database, BarChart3, Upload, Settings, X } from 'lucide-react';

function OptimizedApp() {
  // State management with optimized initial values
  const [excelData, setExcelData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSavedData, setIsCheckingSavedData] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showDebugPage, setShowDebugPage] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslationStopped, setIsTranslationStopped] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing data...');

  // Refs for performance optimization
  const translationAbortController = useRef(null);
  const analysisTimeoutRef = useRef(null);

  // Memoized data statistics
  const dataStats = useMemo(() => {
    if (!excelData) return { rows: 0, columns: 0, totalCells: 0 };
    
    const rows = excelData.length;
    const columns = excelData[0]?.length || 0;
    const totalCells = rows * columns;
    
    return { rows, columns, totalCells };
  }, [excelData]);

  // Optimized data loading
  const checkForSavedData = useCallback(async () => {
    setIsCheckingSavedData(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOAD_DATA);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setExcelData(data.data);
          toast.success('Saved data loaded successfully!', {
            duration: 2000,
            position: 'top-right'
          });
        }
      }
    } catch (error) {
      console.log('No saved data found');
    } finally {
      setIsCheckingSavedData(false);
    }
  }, []);

  // Optimized file upload
  const handleFileUpload = useCallback(async (file) => {
    setIsLoading(true);
    try {
      const parsedData = await parseExcelFile(file);
      setExcelData(parsedData.data);
      console.log('Excel data parsed successfully:', parsedData.metadata);
      
      toast.success(`File loaded: ${parsedData.metadata.totalRows} rows, ${parsedData.metadata.totalColumns} columns`, {
        duration: 3000,
        position: 'top-right'
      });
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast.error('Error parsing Excel file: ' + error.message, {
        duration: 4000,
        position: 'top-right'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimized cell editing with debouncing
  const handleCellEdit = useCallback((rowIndex, colIndex, newValue) => {
    setExcelData(prevData => {
      const newData = [...prevData];
      if (newData[rowIndex] && newData[rowIndex][colIndex]) {
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = {
          ...newData[rowIndex][colIndex],
          cleaned: newValue,
          original: newValue,
          isEmpty: !newValue || newValue.trim() === ''
        };
      }
      return newData;
    });
  }, []);

  // Optimized cell deletion
  const handleCellDelete = useCallback((rowIndex, colIndex) => {
    setExcelData(prevData => {
      const newData = [...prevData];
      if (newData[rowIndex] && newData[rowIndex][colIndex]) {
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = {
          ...newData[rowIndex][colIndex],
          cleaned: '',
          original: '',
          isEmpty: true
        };
      }
      return newData;
    });
  }, []);

  // Optimized data saving
  const handleSaveData = useCallback(async () => {
    if (!excelData) return;

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.SAVE_DATA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: excelData }),
      });
      
      if (response.ok) {
        toast.success('Data saved successfully!', { duration: 2000 });
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [excelData]);

  // Optimized data loading
  const handleLoadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOAD_DATA);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setExcelData(result.data);
          toast.success('Data loaded successfully!', { duration: 2000 });
        } else {
          toast('No saved data found', { duration: 2000 });
        }
      } else {
        throw new Error('Failed to load data');
      }
    } catch (error) {
      console.error('Load failed:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimized bulk analysis with timeout
  const handleBulkAnalyze = useCallback(async () => {
    if (!excelData) return;

    setIsLoading(true);
    setLoadingMessage('Analyzing content...');
    
    // Clear any existing analysis timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    try {
      // Set a timeout for analysis
      analysisTimeoutRef.current = setTimeout(() => {
        toast.warning('Analysis taking longer than expected...', { duration: 3000 });
      }, 5000);

      // Sample data for analysis (first 1000 rows for performance)
      const sampleData = excelData.slice(0, 1000);
      const allContent = sampleData.map(row => 
        row.map(cell => cell.cleaned).join(' ')
      ).join('\n');
      
      const aiAnalysis = await analyzeContent(allContent);
      
      // Basic data analysis
      const dataAnalysis = {
        totalRows: excelData.length,
        sampleRows: sampleData.length,
        emptyCells: excelData.flat().filter(cell => cell.isEmpty).length,
        htmlCells: excelData.flat().filter(cell => cell.hasHtml).length,
        entityCells: excelData.flat().filter(cell => cell.hasEntities).length,
      };
      
      const comprehensiveAnalysis = {
        dataQuality: dataAnalysis,
        contentQuality: aiAnalysis,
        summary: {
          totalCells: dataStats.totalCells,
          emptyCells: dataAnalysis.emptyCells,
          htmlCells: dataAnalysis.htmlCells,
          entityCells: dataAnalysis.entityCells,
          overallQuality: aiAnalysis.quality,
          totalRows: excelData.length
        },
        recommendations: [
          ...aiAnalysis.suggestions,
          ...(dataAnalysis.emptyCells > 0 ? [`${dataAnalysis.emptyCells} empty cells need attention`] : []),
          ...(dataAnalysis.htmlCells > 0 ? [`${dataAnalysis.htmlCells} cells contain HTML`] : []),
          ...(dataAnalysis.entityCells > 0 ? [`${dataAnalysis.entityCells} cells contain HTML entities`] : [])
        ],
        isBulkAnalysis: true
      };
      
      setAnalysis(comprehensiveAnalysis);
      setShowAnalysis(true);
      
      clearTimeout(analysisTimeoutRef.current);
    } catch (error) {
      console.error('Bulk analysis failed:', error);
      toast.error('Analysis failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [excelData, dataStats]);

  // Optimized bulk translation with abort controller
  const handleBulkTranslate = useCallback(async (targetLanguage = 'en') => {
    if (!excelData) return;

    // Cancel any existing translation
    if (translationAbortController.current) {
      translationAbortController.current.abort();
    }
    translationAbortController.current = new AbortController();

    setIsLoading(true);
    setIsTranslationStopped(false);
    resetTranslationCancellation();
    
    const languageNames = {
      'en': 'English', 'ru': 'Russian', 'az': 'Azerbaijani', 'tr': 'Turkish'
    };
    
    setLoadingMessage(`Translating to ${languageNames[targetLanguage] || 'English'}...`);
    
    try {
      // Collect unique content for translation
      const contentToTranslate = new Set();
      excelData.forEach((row) => {
        row.forEach((cell) => {
          if (cell.cleaned && cell.cleaned.trim()) {
            contentToTranslate.add(cell.cleaned.trim());
          }
        });
      });

      const uniqueContent = Array.from(contentToTranslate);
      console.log(`🔄 Found ${uniqueContent.length} unique pieces of content to translate`);

      if (isTranslationStopped) {
        // Translation stopped
        toast('Translation stopped', { duration: 2000 });
        return;
      }

      console.log('🔄 Starting translation process...');
      console.log('📊 Content to translate:', uniqueContent.length, 'unique items');
      
      // Translate with abort signal
      const translations = await translateBatchStructured(uniqueContent, targetLanguage, translationAbortController.current.signal);
      
      console.log('✅ Translation completed:', translations.length, 'translations received');
      
      if (isTranslationStopped) {
        // Translation stopped
        toast('Translation stopped', { duration: 2000 });
        return;
      }
      
      // Create translation map
      const translationMap = new Map();
      uniqueContent.forEach((content, index) => {
        translationMap.set(content, translations[index] || content);
      });

      console.log('🔄 Updating data with translations...');
      
      // Apply translations
      const translatedData = excelData.map((row) => 
        row.map((cell) => {
          if (cell.cleaned && cell.cleaned.trim()) {
            const translated = translationMap.get(cell.cleaned.trim()) || cell.cleaned;
            return {
              ...cell,
              cleaned: translated,
              original: translated
            };
          }
          return cell;
        })
      );
      
      console.log('✅ Data updated successfully');
      setExcelData(translatedData);
      
      // Translation completed
      toast.success(`Successfully translated to ${languageNames[targetLanguage] || 'English'}!`, {
        duration: 3000,
        position: 'top-right'
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        // Translation stopped
        toast('Translation cancelled', { duration: 2000 });
      } else {
        console.error('Bulk translation failed:', error);
        // Translation stopped
        toast.error('Translation failed: ' + error.message);
      }
    } finally {
      setIsLoading(false);
      translationAbortController.current = null;
    }
  }, [excelData, isTranslationStopped]);

  // Optimized stop translation
  const handleStopTranslation = useCallback(() => {
    console.log('🛑 Stop translation requested');
    setIsTranslationStopped(true);
    setIsLoading(false);
    
    if (translationAbortController.current) {
      translationAbortController.current.abort();
    }
    
    cancelTranslation();
    toast.dismiss();
    toast('Translation stopped by user', { duration: 2000 });
  }, []);

  // Optimized language selection
  const handleLanguageSelect = useCallback((languageCode) => {
    setSelectedLanguage(languageCode);
    handleBulkTranslate(languageCode);
  }, [handleBulkTranslate]);

  // Optimized export
  const handleExportOriginal = useCallback(() => {
    if (!excelData) return;
    exportToExcel(excelData, 'processed_data.xlsx');
  }, [excelData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      if (translationAbortController.current) {
        translationAbortController.current.abort();
      }
    };
  }, []);

  // Initial data load
  useEffect(() => {
    checkForSavedData();
  }, [checkForSavedData]);

  // Show debug page if requested
  if (showDebugPage) {
    return <DebugPage onBack={() => setShowDebugPage(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 space-y-4 lg:space-y-0">
            <div className="flex items-center">
              <FileSpreadsheet className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Excel Content Processor
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  AI-powered data processing and analysis
                </p>
              </div>
            </div>
            {excelData && (
              <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                <button
                  onClick={handleBulkAnalyze}
                  disabled={isLoading}
                  className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyze
                </button>
                <button
                  onClick={() => setShowLanguageSelector(true)}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Translate
                </button>
                <button
                  onClick={handleSaveData}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Load
                </button>
                <button
                  onClick={handleExportOriginal}
                  className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 flex items-center text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                <button
                  onClick={() => setShowModelSelector(true)}
                  className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center text-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Models
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stop Button - Always on top during translation */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-[9999]">
          <button
            onClick={handleStopTranslation}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center text-base shadow-2xl animate-pulse border-2 border-red-400 font-semibold"
            style={{ 
              position: 'fixed',
              top: '16px',
              right: '16px',
              zIndex: 9999,
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
            }}
          >
            <X className="h-5 w-5 mr-2" />
            Stop Translation
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-xl pointer-events-auto">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">{loadingMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isCheckingSavedData ? (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Checking for Saved Data
                </h2>
                <p className="text-gray-600 mb-6">
                  Looking for previously saved data...
                </p>
              </div>
            </div>
          </div>
        ) : !excelData ? (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                  <FileSpreadsheet className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Excel Content Processor
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Transform your complex HTML-encoded Excel data into clean, readable content. 
                  Upload, analyze, translate, and export with AI-powered processing.
                </p>
              </div>
              <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Data Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
                    Processed Data
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {dataStats.rows} rows • {dataStats.columns} columns • {dataStats.totalCells} cells
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-green-600 text-sm font-medium">Ready</span>
                </div>
              </div>
            </div>

            {/* Optimized Data Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <OptimizedDataTable
                data={excelData}
                onCellEdit={handleCellEdit}
                onCellDelete={handleCellDelete}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </main>

      {/* Analysis Panel */}
      <AnalysisPanel
        analysis={analysis}
        isVisible={showAnalysis}
        onClose={() => setShowAnalysis(false)}
      />

      {/* Language Selector */}
      <LanguageSelector
        isVisible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onLanguageSelect={handleLanguageSelect}
        currentLanguage={selectedLanguage}
      />

      {/* Model Selector Modal */}
      <ModelSelector
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
      />
    </div>
  );
}

// Wrap App with ErrorBoundary for better error handling
const OptimizedAppWithErrorBoundary = () => (
  <ErrorBoundary>
    <OptimizedApp />
  </ErrorBoundary>
);

export default OptimizedAppWithErrorBoundary;

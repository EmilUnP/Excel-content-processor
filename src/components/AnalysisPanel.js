import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Lightbulb, BarChart3, FileText, Code, Database, X } from 'lucide-react';

const AnalysisPanel = ({ analysis, isVisible, onClose }) => {
  if (!isVisible || !analysis) return null;

  const getQualityIcon = (quality) => {
    switch (quality) {
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fair':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'poor':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getQualityText = (quality) => {
    switch (quality) {
      case 'good': return 'Good Quality';
      case 'fair': return 'Fair Quality';
      case 'poor': return 'Poor Quality';
      default: return 'Unknown Quality';
    }
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
              Comprehensive Analysis Report
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Summary Section */}
          {analysis.summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-blue-500" />
                Data Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{analysis.summary.totalCells}</div>
                  <div className="text-sm text-blue-800">Total Cells</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{analysis.summary.emptyCells}</div>
                  <div className="text-sm text-red-800">Empty Cells</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{analysis.summary.htmlCells}</div>
                  <div className="text-sm text-yellow-800">HTML Cells</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{analysis.summary.entityCells}</div>
                  <div className="text-sm text-orange-800">Entity Cells</div>
                </div>
              </div>
            </div>
          )}

          {/* Quality Assessment */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-500" />
              Content Quality
            </h3>
            <div className={`p-4 rounded-lg border-2 ${getQualityColor(analysis.contentQuality?.quality || analysis.quality)}`}>
              <div className="flex items-center space-x-3">
                {getQualityIcon(analysis.contentQuality?.quality || analysis.quality)}
                <span className="text-lg font-medium">
                  {getQualityText(analysis.contentQuality?.quality || analysis.quality)}
                </span>
              </div>
              {analysis.contentQuality?.isComplete !== undefined && (
                <div className="mt-2 flex items-center space-x-2">
                  <CheckCircle className={`h-4 w-4 ${analysis.contentQuality.isComplete ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm">
                    {analysis.contentQuality.isComplete ? 'Content is complete' : 'Content appears incomplete'}
                  </span>
                </div>
              )}
              </div>
            </div>

          {/* Data Quality Issues */}
          {analysis.dataQuality && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Code className="h-5 w-5 mr-2 text-red-500" />
                Data Quality Issues
              </h3>
              <div className="space-y-3">
                {analysis.dataQuality.emptyCells.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="font-medium text-red-800">Empty Cells ({analysis.dataQuality.emptyCells.length})</div>
                    <div className="text-sm text-red-600 mt-1">
                      {analysis.dataQuality.emptyCells.slice(0, 5).join(', ')}
                      {analysis.dataQuality.emptyCells.length > 5 && ` and ${analysis.dataQuality.emptyCells.length - 5} more...`}
                </div>
              </div>
            )}
                {analysis.dataQuality.htmlCells.length > 0 && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="font-medium text-yellow-800">HTML Content ({analysis.dataQuality.htmlCells.length})</div>
                    <div className="text-sm text-yellow-600 mt-1">
                      {analysis.dataQuality.htmlCells.slice(0, 5).join(', ')}
                      {analysis.dataQuality.htmlCells.length > 5 && ` and ${analysis.dataQuality.htmlCells.length - 5} more...`}
                </div>
              </div>
            )}
                {analysis.dataQuality.entityCells.length > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <div className="font-medium text-orange-800">HTML Entities ({analysis.dataQuality.entityCells.length})</div>
                    <div className="text-sm text-orange-600 mt-1">
                      {analysis.dataQuality.entityCells.slice(0, 5).join(', ')}
                      {analysis.dataQuality.entityCells.length > 5 && ` and ${analysis.dataQuality.entityCells.length - 5} more...`}
                </div>
              </div>
            )}
          </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                Recommendations
              </h3>
              <div className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;

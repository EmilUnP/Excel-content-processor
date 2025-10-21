import React, { useState, useEffect } from 'react';
import { getAvailableModels, getCurrentModels, setModel } from '../utils/optimizedAiService';
import { Settings, Check, Zap, DollarSign, Clock, Brain, Cpu, Target } from 'lucide-react';

const ModelSelector = ({ isOpen, onClose }) => {
  const [models, setModels] = useState({});
  const [currentModels, setCurrentModels] = useState({});
  const [selectedTranslation, setSelectedTranslation] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState('');

  useEffect(() => {
    if (isOpen) {
      const availableModels = getAvailableModels();
      const current = getCurrentModels();
      setModels(availableModels);
      setCurrentModels(current);
      setSelectedTranslation(current.translation);
      setSelectedAnalysis(current.analysis);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (selectedTranslation !== currentModels.translation) {
      setModel('translation', selectedTranslation);
    }
    if (selectedAnalysis !== currentModels.analysis) {
      setModel('analysis', selectedAnalysis);
    }
    onClose();
  };

  const getCostIcon = (cost) => {
    switch (cost) {
      case 'low': return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'medium': return <DollarSign className="w-4 h-4 text-yellow-500" />;
      case 'high': return <DollarSign className="w-4 h-4 text-red-500" />;
      default: return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCostText = (cost) => {
    switch (cost) {
      case 'low': return 'Low Cost';
      case 'medium': return 'Medium Cost';
      case 'high': return 'High Cost';
      default: return 'Unknown';
    }
  };

  const getCostColor = (cost) => {
    switch (cost) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getModelIcon = (modelKey) => {
    if (modelKey.includes('gpt-5')) {
      return <Brain className="w-4 h-4 text-purple-500" />;
    } else if (modelKey.includes('gpt-4')) {
      return <Cpu className="w-4 h-4 text-blue-500" />;
    } else {
      return <Target className="w-4 h-4 text-green-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">AI Model Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Translation Models */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                Translation Models
              </h3>
              <div className="space-y-3">
                {Object.entries(models.TRANSLATION || {}).map(([key, model]) => (
                  <label
                    key={key}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTranslation === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="translation"
                      value={key}
                      checked={selectedTranslation === key}
                      onChange={(e) => setSelectedTranslation(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getModelIcon(key)}
                          <h4 className="font-medium text-gray-900">{model.name}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getCostIcon(model.cost)}
                          <span className={`text-sm font-medium ${getCostColor(model.cost)}`}>{getCostText(model.cost)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      
                      {/* Enhanced model specifications */}
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-gray-50 rounded p-2">
                            <span className="font-medium text-gray-700">Max Tokens:</span>
                            <span className="ml-1 text-gray-600">{model.maxTokens.toLocaleString()}</span>
                          </div>
                          {model.contextWindow && (
                            <div className="bg-gray-50 rounded p-2">
                              <span className="font-medium text-gray-700">Context:</span>
                              <span className="ml-1 text-gray-600">{model.contextWindow.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Pricing information */}
                        {model.pricing && (
                          <div className="bg-blue-50 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-700">Pricing</span>
                              <span className="text-xs text-blue-600">{model.pricing.unit}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600">Input:</span>
                                <span className="ml-1 font-medium text-green-600">{model.pricing.input}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Output:</span>
                                <span className="ml-1 font-medium text-green-600">{model.pricing.output}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Model features */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {model.structuredOutput && (
                            <span className="flex items-center">
                              <Check className="w-3 h-3 mr-1 text-green-500" />
                              Structured Output
                            </span>
                          )}
                          {selectedTranslation === key && (
                            <span className="flex items-center text-blue-600 font-medium">
                              <Check className="w-3 h-3 mr-1" />
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Analysis Models */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Analysis Models
              </h3>
              <div className="space-y-3">
                {Object.entries(models.ANALYSIS || {}).map(([key, model]) => (
                  <label
                    key={key}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAnalysis === key
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="analysis"
                      value={key}
                      checked={selectedAnalysis === key}
                      onChange={(e) => setSelectedAnalysis(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getModelIcon(key)}
                          <h4 className="font-medium text-gray-900">{model.name}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getCostIcon(model.cost)}
                          <span className={`text-sm font-medium ${getCostColor(model.cost)}`}>{getCostText(model.cost)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      
                      {/* Enhanced model specifications */}
                      <div className="mt-3 space-y-2">
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-xs font-medium text-gray-700">Max Tokens:</span>
                          <span className="ml-1 text-xs text-gray-600">{model.maxTokens.toLocaleString()}</span>
                        </div>
                        
                        {/* Pricing information */}
                        {model.pricing && (
                          <div className="bg-green-50 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-green-700">Pricing</span>
                              <span className="text-xs text-green-600">{model.pricing.unit}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600">Input:</span>
                                <span className="ml-1 font-medium text-green-600">{model.pricing.input}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Output:</span>
                                <span className="ml-1 font-medium text-green-600">{model.pricing.output}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Model features */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {model.structuredOutput && (
                            <span className="flex items-center">
                              <Check className="w-3 h-3 mr-1 text-green-500" />
                              Structured Output
                            </span>
                          )}
                          {selectedAnalysis === key && (
                            <span className="flex items-center text-green-600 font-medium">
                              <Check className="w-3 h-3 mr-1" />
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;

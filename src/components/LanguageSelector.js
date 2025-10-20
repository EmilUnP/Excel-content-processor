import React, { useState } from 'react';
import { X, Globe, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' }
];

const LanguageSelector = ({ isVisible, onClose, onLanguageSelect, currentLanguage = 'en' }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  if (!isVisible) return null;

  const handleConfirm = () => {
    onLanguageSelect(selectedLanguage);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Select Target Language
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Choose the language you want to translate your data to:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => setSelectedLanguage(language.code)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                  selectedLanguage === language.code
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{language.flag}</span>
                  <span className="font-medium">{language.name}</span>
                  <span className="text-sm text-gray-500">({language.code.toUpperCase()})</span>
                </div>
                {selectedLanguage === language.code && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Translate to {languages.find(l => l.code === selectedLanguage)?.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;

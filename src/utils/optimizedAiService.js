// Optimized AI Service with aggressive performance improvements
import axios from 'axios';

// Enhanced caching with LRU eviction
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

// Performance-optimized caches
const analysisCache = new LRUCache(500);
const translationCache = new LRUCache(2000);
const contentCache = new LRUCache(1000);

// Translation cancellation support
let translationCancelled = false;

// OpenAI API configuration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Optimized models configuration
const OPTIMIZED_MODELS = {
  TRANSLATION: {
    'gpt-4o': {
      name: 'GPT-4o',
      description: 'Best quality with optimized performance',
      maxTokens: 6000, // Increased for better batching
      cost: 'high',
      structuredOutput: true,
      contextWindow: 128000,
      batchSize: 80 // Optimized batch size
    },
    'gpt-4-turbo': {
      name: 'GPT-4 Turbo',
      description: 'Fast and efficient',
      maxTokens: 6000,
      cost: 'high',
      structuredOutput: true,
      contextWindow: 128000,
      batchSize: 80
    },
    'gpt-3.5-turbo-16k': {
      name: 'GPT-3.5 Turbo 16K',
      description: 'Good balance of speed and cost',
      maxTokens: 4000,
      cost: 'medium',
      structuredOutput: false,
      contextWindow: 16384,
      batchSize: 100
    }
  },
  ANALYSIS: {
    'gpt-4o': {
      name: 'GPT-4o',
      description: 'Best analysis quality',
      maxTokens: 800,
      cost: 'high',
      structuredOutput: true
    },
    'gpt-3.5-turbo': {
      name: 'GPT-3.5 Turbo',
      description: 'Fast analysis',
      maxTokens: 400,
      cost: 'low',
      structuredOutput: false
    }
  }
};

// Default optimized model selection
let DEFAULT_TRANSLATION_MODEL = 'gpt-4o';
let DEFAULT_ANALYSIS_MODEL = 'gpt-4o';

// Export model information
export const getAvailableModels = () => OPTIMIZED_MODELS;
export const getCurrentModels = () => ({
  translation: DEFAULT_TRANSLATION_MODEL,
  analysis: DEFAULT_ANALYSIS_MODEL
});

export const setModel = (task, modelId) => {
  if (task === 'translation' && OPTIMIZED_MODELS.TRANSLATION[modelId]) {
    DEFAULT_TRANSLATION_MODEL = modelId;
    console.log(`🔄 Translation model changed to: ${OPTIMIZED_MODELS.TRANSLATION[modelId].name}`);
  } else if (task === 'analysis' && OPTIMIZED_MODELS.ANALYSIS[modelId]) {
    DEFAULT_ANALYSIS_MODEL = modelId;
    console.log(`🔄 Analysis model changed to: ${OPTIMIZED_MODELS.ANALYSIS[modelId].name}`);
  }
};

// Optimized content cleaning with caching
const cleanContentForTranslation = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  // Check cache first
  const cacheKey = `clean_${content.length}_${content.slice(0, 20)}`;
  const cached = contentCache.get(cacheKey);
  if (cached) return cached;
  
  const cleaned = content
    .replace(/&#\d+;/g, (match) => {
      try {
        return String.fromCharCode(parseInt(match.slice(2, -1), 10));
      } catch {
        return match;
      }
    })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  contentCache.set(cacheKey, cleaned);
  return cleaned;
};

// Optimized analysis function
export const analyzeContent = async (content) => {
  const cacheKey = `analysis_${content.length}_${content.slice(0, 50)}`;
  const cached = analysisCache.get(cacheKey);
  if (cached) {
    console.log('📦 Using cached analysis');
    return cached;
  }

  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    const fallback = getFallbackAnalysis(content);
    analysisCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const cleanedContent = cleanContentForTranslation(content);
    const truncatedContent = cleanedContent.length > 1500 
      ? cleanedContent.substring(0, 1500) + '...'
      : cleanedContent;

    const selectedModel = DEFAULT_ANALYSIS_MODEL;
    const modelConfig = OPTIMIZED_MODELS.ANALYSIS[selectedModel];
    
    const apiRequest = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: 'Analyze content quality. Return JSON: {"isComplete": boolean, "hasIssues": boolean, "quality": "good|fair|poor", "suggestions": ["string"]}'
        },
        {
          role: 'user',
          content: `Analyze: "${truncatedContent}"`
        }
      ],
      max_tokens: modelConfig.maxTokens,
      temperature: 0.2
    };

    const response = await axios.post(OPENAI_API_URL, apiRequest, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    let analysis;
    
    try {
      analysis = JSON.parse(aiResponse);
    } catch {
      analysis = getFallbackAnalysis(content);
    }

    analysisCache.set(cacheKey, analysis);
    return analysis;
  } catch (error) {
    console.warn('Analysis API error:', error.message);
    const fallback = getFallbackAnalysis(content);
    analysisCache.set(cacheKey, fallback);
    return fallback;
  }
};

// Optimized batch translation with aggressive batching
export const translateBatchStructured = async (contentArray, targetLanguage = 'en', abortSignal = null) => {
  console.log('🚀 Optimized batch translation:', { count: contentArray.length, targetLanguage });
  
  translationCancelled = false;
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    return contentArray.map(content => cleanContentForTranslation(content));
  }

  const languageNames = {
    'en': 'English',
    'ru': 'Russian', 
    'az': 'Azerbaijani',
    'tr': 'Turkish'
  };

  const targetLanguageName = languageNames[targetLanguage] || 'English';
  const selectedModel = DEFAULT_TRANSLATION_MODEL;
  const modelConfig = OPTIMIZED_MODELS.TRANSLATION[selectedModel];

  // Use optimized batch size
  const BATCH_SIZE = modelConfig.batchSize || 80;
  const allTranslations = [];
  
  // Pre-clean all content
  const cleanedContent = contentArray.map(content => {
    const cleaned = cleanContentForTranslation(content);
    return cleaned.length > 1500 ? cleaned.substring(0, 1500) + '...' : cleaned;
  });

  for (let i = 0; i < cleanedContent.length; i += BATCH_SIZE) {
    // Check for cancellation via abort signal
    if (abortSignal && abortSignal.aborted) {
      console.log('🛑 Translation cancelled via abort signal');
      throw new Error('Translation cancelled by user');
    }
    
    if (translationCancelled) {
      console.log('🛑 Translation cancelled');
      throw new Error('Translation cancelled by user');
    }

    const batch = cleanedContent.slice(i, i + BATCH_SIZE);
    console.log(`🔄 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(cleanedContent.length/BATCH_SIZE)} (${batch.length} items)`);
    
    try {
      const apiRequest = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `Translate to ${targetLanguageName}. Return JSON: {"translations": ["translated1", "translated2", ...]}`
          },
          {
            role: 'user',
            content: `Translate these ${batch.length} items:\n\n${batch.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
          }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: 0.1,
        response_format: { type: "json_object" }
      };

      const response = await axios.post(OPENAI_API_URL, apiRequest, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: abortSignal
      });

      if (translationCancelled) {
        throw new Error('Translation cancelled by user');
      }

      // Check abort signal after API call
      if (abortSignal && abortSignal.aborted) {
        console.log('🛑 Translation cancelled via abort signal after API call');
        throw new Error('Translation cancelled by user');
      }

      const aiResponse = response.data.choices[0].message.content;
      const jsonResponse = JSON.parse(aiResponse);
      
      let translations = [];
      if (jsonResponse.translations && Array.isArray(jsonResponse.translations)) {
        translations = jsonResponse.translations;
      } else if (Array.isArray(jsonResponse)) {
        translations = jsonResponse;
      } else {
        translations = Object.values(jsonResponse);
      }
      
      // Ensure proper order and fill missing translations
      const paddedTranslations = [];
      for (let j = 0; j < batch.length; j++) {
        if (j < translations.length && translations[j] && translations[j].trim()) {
          paddedTranslations.push(translations[j]);
        } else {
          paddedTranslations.push(batch[j]); // Use original if translation missing
        }
      }
      
      allTranslations.push(...paddedTranslations);
      
    } catch (error) {
      console.error(`Batch translation error:`, error.message);
      // Add fallback translations
      allTranslations.push(...batch);
    }
  }

  return allTranslations;
};

// Fallback analysis function
const getFallbackAnalysis = (content) => {
  return {
    isComplete: content.length > 10,
    hasIssues: content.includes('undefined') || content.includes('null'),
    quality: content.length > 50 ? 'good' : content.length > 20 ? 'fair' : 'poor',
    suggestions: [
      ...(content.length < 10 ? ['Content seems too short'] : []),
      ...(content.includes('undefined') || content.includes('null') ? ['Contains undefined/null values'] : [])
    ]
  };
};

// Cancellation functions
export const cancelTranslation = () => {
  translationCancelled = true;
  console.log('🛑 Translation cancellation requested');
};

export const resetTranslationCancellation = () => {
  translationCancelled = false;
  console.log('🔄 Translation cancellation reset');
};

// Cache management
export const clearCaches = () => {
  analysisCache.clear();
  translationCache.clear();
  contentCache.clear();
  console.log('🧹 All caches cleared');
};

export const getCacheStats = () => ({
  analysis: analysisCache.cache.size,
  translation: translationCache.cache.size,
  content: contentCache.cache.size
});

// Debug functions for DebugPage
let debugData = [];

export const getDebugData = () => debugData;

export const clearDebugData = () => {
  debugData = [];
};

export const translateContent = async (content, targetLanguage = 'en') => {
  const startTime = performance.now();
  const debugEntry = {
    type: 'translation',
    language: targetLanguage,
    originalContent: content,
    cleanedContent: content,
    timestamp: new Date().toISOString(),
    success: false,
    result: null,
    error: null,
    duration: 0,
    apiRequest: null,
    apiResponse: null
  };

  try {
    const result = await translateBatchStructured([content], targetLanguage, null);
    debugEntry.success = true;
    debugEntry.result = result[0];
    debugEntry.duration = performance.now() - startTime;
  } catch (error) {
    debugEntry.error = error.message;
    debugEntry.duration = performance.now() - startTime;
  }

  debugData.push(debugEntry);
  return debugEntry.result;
};

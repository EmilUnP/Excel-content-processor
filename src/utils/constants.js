// Application constants and configuration

export const API_ENDPOINTS = {
  SAVE_DATA: 'http://localhost:3001/api/save-data',
  LOAD_DATA: 'http://localhost:3001/api/load-data',
  CLEAR_DATA: 'http://localhost:3001/api/clear-data',
  HEALTH: 'http://localhost:3001/api/health'
};

export const PERFORMANCE_CONFIG = {
  BATCH_SIZE: 5,
  CACHE_LIMIT: {
    ANALYSIS: 100,
    TRANSLATION: 200
  },
  TIMEOUTS: {
    ANALYSIS: 500,
    TRANSLATION: 300
  }
};

export const UI_CONFIG = {
  MAX_DISPLAY_ITEMS: 10,
  CELL_EDIT_ROWS: 3,
  CELL_MIN_HEIGHT: '60px'
};

export const SUPPORTED_LANGUAGES = [
  { code: 'az', name: 'Azerbaijan' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Russian' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' }
];

export const COLUMN_TYPES = {
  ID: 'id',
  QUESTION: 'question',
  VARIANT: 'variant',
  CODE: 'code'
};

export const CELL_STATES = {
  EMPTY: 'empty',
  HTML: 'html',
  ENTITIES: 'entities',
  CLEAN: 'clean'
};

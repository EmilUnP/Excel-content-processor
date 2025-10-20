# Excel Content Processor

A React-based web application that processes Excel files with complex HTML-encoded content, providing cleaning, AI analysis, translation, and export capabilities.

## Features

- **Excel File Upload**: Drag & drop interface for .xlsx and .xls files
- **Content Cleaning**: Automatically decodes HTML entities and cleans up complex text formatting
- **AI Analysis**: Analyzes content completeness and quality
- **Translation**: AI-powered translation to multiple languages
- **Manual Editing**: In-place editing of processed content
- **Export**: Download processed data in original Excel format

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### AI Integration (Optional)

The application includes mock AI services for demonstration. To use real AI services:

1. **For OpenAI integration:**
   - Get your API key from OpenAI
   - Create a `.env` file in the root directory
   - Add: `REACT_APP_OPENAI_API_KEY=your_api_key_here`
   - Uncomment the OpenAI functions in `src/utils/aiService.js`

2. **For Gemini integration:**
   - Get your API key from Google AI
   - Create a `.env` file in the root directory
   - Add: `REACT_APP_GEMINI_API_KEY=your_api_key_here`
   - Uncomment the Gemini functions in `src/utils/aiService.js`

## Usage

1. **Upload Excel File**: Drag and drop your Excel file or click to browse
2. **View Processed Data**: The application will automatically clean and decode HTML content
3. **Edit Content**: Click on any cell to edit the content manually
4. **Analyze Content**: Use the analyze button to check content quality and completeness
5. **Translate Content**: Use the translate button to convert content to different languages
6. **Export Results**: Download the processed data as an Excel file

## File Structure

```
src/
├── components/
│   ├── FileUpload.js          # File upload with drag & drop
│   ├── DataTable.js           # Data display and editing interface
│   ├── AnalysisPanel.js       # AI analysis results modal
│   └── TranslationPanel.js    # Translation interface modal
├── utils/
│   ├── excelParser.js         # Excel file parsing and export
│   └── aiService.js           # AI analysis and translation services
├── App.js                     # Main application component
├── index.js                   # Application entry point
└── index.css                  # Global styles with TailwindCSS
```

## Supported File Formats

- Microsoft Excel (.xlsx)
- Microsoft Excel 97-2003 (.xls)

## Supported Languages for Translation

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Russian (ru)
- Chinese (zh)
- Japanese (ja)
- Arabic (ar)

## Technical Details

- **Frontend**: React 18 with functional components and hooks
- **Styling**: TailwindCSS for responsive design
- **File Processing**: SheetJS (xlsx) for Excel file handling
- **UI Components**: Custom components with Lucide React icons
- **State Management**: React useState and useEffect hooks

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.

// Sample Excel file generator for testing
// Run this with: node create-sample-excel.js

const XLSX = require('xlsx');

// Sample data matching your exact Excel structure with 11 columns
const sampleData = [
  // Header row
  [
    "ID",
    "Question_ID", 
    "Question_Text",
    "Variant_1_Question",
    "Variant_1_Code",
    "Variant_2_Question", 
    "Variant_2_Code",
    "Variant_3_Question",
    "Variant_3_Code",
    "Variant_4_Question",
    "Variant_4_Code"
  ],
  // Data row 1 - QuickSort question
  [
    "250811082703529199",
    "inf-ru-00001", 
    '<span>&#1050;&#1072;&#1082;&#1086;&#1074;&#1072;&#10;&#1074;&#1088;&#1077;&#1084;&#1077;&#1085;&#1085;&#1072;&#1103; &#1089;&#1083;&#1086;&#1078;&#1085;&#1086;&#1089;&#1090;&#1100; &#1072;&#1083;&#1075;&#1086;&#1088;&#1080;&#1090;&#1084;&#1072; &#1089;&#1086;&#1088;&#1090;&#1080;&#1088;&#1086;&#1074;&#1082;&#1080; <b>&#1073;&#1099;&#1089;&#1090;&#1088;&#1086;&#1081; &#1089;&#1086;&#1088;&#1090;&#1080;&#1088;&#1086;&#1074;&#1082;&#1080; (</b></span><b><span lang="EN-US">QuickSort</span><span>)</span></b><span> &#1074; &#1093;&#1091;&#1076;&#1096;&#1077;&#1084; &#1089;&#1083;&#1091;&#1095;&#1072;&#1077;?</span>',
    '<span lang="EN-US">O</span><span>(</span><span lang="EN-US">n</span><span>)</span>',
    "0",
    '<span lang="EN-US">O</span><span>(</span><span lang="EN-US">n</span><span lang="EN-US"> </span><span lang="EN-US">log</span><span lang="EN-US"> </span><span lang="EN-US">n</span><span>)</span>',
    "0",
    "O(n&#178;)",
    "1",
    '<span lang="EN-US">O</span><span>(</span><span lang="EN-US">log</span><span lang="EN-US"> </span><span lang="EN-US">n</span><span>)</span>',
    "0"
  ],
  // Data row 2 - Bubble Sort question
  [
    "250811082703529200",
    "inf-ru-00002",
    '<span>&#1050;&#1072;&#1082;&#1086;&#1077; &#1074;&#1088;&#1077;&#1084;&#1103; &#1089;&#1083;&#1086;&#1078;&#1085;&#1086;&#1089;&#1090;&#1080; &#1072;&#1083;&#1075;&#1086;&#1088;&#1080;&#1090;&#1084;&#1072; <b>&#1089;&#1086;&#1088;&#1090;&#1080;&#1088;&#1086;&#1074;&#1082;&#1080; &#1087;&#1091;&#1079;&#1099;&#1088;&#1100;&#1082;&#1086;&#1084;</b> &#1074; &#1093;&#1091;&#1076;&#1096;&#1077;&#1084; &#1089;&#1083;&#1091;&#1095;&#1072;&#1077;?</span>',
    '<span lang="EN-US">O</span><span>(</span><span lang="EN-US">n</span><span>)</span>',
    "0",
    '<span lang="EN-US">O</span><span>(</span><span lang="EN-US">n</span><span lang="EN-US"> </span><span lang="EN-US">log</span><span lang="EN-US"> </span><span lang="EN-US">n</span><span>)</span>',
    "0",
    "O(n&#178;)",
    "1",
    '<span lang="EN-US">O</span><span>(</span><span lang="EN-US">log</span><span lang="EN-US"> </span><span lang="EN-US">n</span><span>)</span>',
    "0"
  ],
  // Data row 3 - Insertion Sort question
  [
    "250811082703529201",
    "inf-ru-00003",
    '<span>&#1050;&#1072;&#1082;&#1086;&#1077; &#1074;&#1088;&#1077;&#1084;&#1103; &#1089;&#1083;&#1086;&#1078;&#1085;&#1086;&#1089;&#1090;&#1080; &#1072;&#1083;&#1075;&#1086;&#1088;&#1080;&#1090;&#1084;&#1072; <b>&#1089;&#1086;&#1088;&#1090;&#1080;&#1088;&#1086;&#1074;&#1082;&#1080; &#1074;&#1089;&#1090;&#1072;&#1074;&#1082;&#1072;&#1084;&#1080;</b> &#1074; &#1093;&#1091;&#1076;&#1096;&#1077;&#1084; &#1089;&#1083;&#1091;&#1095;&#1072;&#1077;?</span>',
    '<span lang="EN-US">O</span><span>(</span><span lang="EN-US">n</span><span>)</span>',
    "0",
    '<span lang="EN-US">O</span><span>(</span><span lang="EN-US">n</span><span lang="EN-US"> </span><span lang="EN-US">log</span><span lang="EN-US"> </span><span lang="EN-US">n</span><span>)</span>',
    "0",
    "O(n&#178;)",
    "1",
    '<span lang="EN-US">O</span><span>(</span><span lang="EN-US">log</span><span lang="EN-US"> </span><span lang="EN-US">n</span><span>)</span>',
    "0"
  ]
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Data');

// Write the file
XLSX.writeFile(workbook, 'sample-excel-data.xlsx');

console.log('Sample Excel file created: sample-excel-data.xlsx');
console.log('You can now upload this file to test the application.');

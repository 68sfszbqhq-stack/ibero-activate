const fs = require('fs');
const path = require('path');

const filesToFix = [
  'js/calendar.js',
  'js/attendance.js',
  'js/dashboard-admin.js'
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  console.log('Fixing:', filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace: .toISOString().split('T')[0]
  // With: .toLocaleDateString('en-CA', {timeZone: 'America/Mexico_City'})
  // Let's use a safe helper function insertion instead, or just inline string format.
  // The simplest is:
  // (function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})(YOUR_DATE_VAR)
  
  // Actually, toLocaleDateString('en-CA') is completely sufficient and doesn't break syntax if appended directly.
  const regex = /\.toISOString\(\)\.split\('T'\)\[0\]/g;
  content = content.replace(regex, ".toLocaleDateString('en-CA')");
  
  fs.writeFileSync(filePath, content);
}

filesToFix.forEach(fixFile);
console.log('Done.');

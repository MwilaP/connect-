const fs = require('fs');
const path = require('path');

// Function to update imports in a file
function updateImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace @/lib/utils with relative path
    const updatedContent = content.replace(/from ['"]@\/lib\/utils['"]/g, `from '../../lib/utils'`);
    
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Get all UI component files
const uiDir = path.join(__dirname, 'components', 'ui');
const files = fs.readdirSync(uiDir);

// Update imports in each file
files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    updateImportsInFile(path.join(uiDir, file));
  }
});

console.log('All imports updated successfully!');

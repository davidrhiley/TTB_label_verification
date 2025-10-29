const fs = require('fs');
const path = require('path');

async function globalTeardown() {
  // Find and remove .last-run.json files from test-results directories
  const testResultsDir = path.join(__dirname, 'test-results');
  
  if (!fs.existsSync(testResultsDir)) {
    return;
  }

  // Remove .last-run.json files
  const files = fs.readdirSync(testResultsDir, { recursive: true, withFileTypes: true });
  
  for (const file of files) {
    if (file.isFile() && file.name === '.last-run.json') {
      const lastRunPath = path.join(file.path, file.name);
      try {
        fs.unlinkSync(lastRunPath);
        console.log(`Removed ${lastRunPath}`);
      } catch (err) {
        // Ignore errors
      }
    }
  }
}

module.exports = globalTeardown;

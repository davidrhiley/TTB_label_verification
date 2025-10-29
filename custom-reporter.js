const fs = require('fs');
const path = require('path');

class FailPrefixReporter {
  constructor() {
    this.testResultsDir = path.join(process.cwd(), 'test-results');
  }

  onBegin(config, suite) {
    // Called once before running tests
  }

  onTestEnd(test, result) {
    // Called after each test - not renaming here as files may still be open
  }

  async onEnd(result) {
    // Called after all tests complete
    // Small delay to ensure all files are closed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Rename any test output directories to add FAIL- prefix
    if (fs.existsSync(this.testResultsDir)) {
      const items = fs.readdirSync(this.testResultsDir);
      
      for (const item of items) {
        // Skip .last-run.json and directories that already start with FAIL-
        if (item === '.last-run.json' || item.startsWith('FAIL-')) {
          continue;
        }
        
        const oldPath = path.join(this.testResultsDir, item);
        
        // Only rename directories
        if (fs.existsSync(oldPath) && fs.statSync(oldPath).isDirectory()) {
          const newPath = path.join(this.testResultsDir, 'FAIL-' + item);
          
          try {
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed: ${item} -> FAIL-${item}`);
          } catch (err) {
            console.error(`Failed to rename ${item}:`, err.message);
          }
        }
      }
    }
  }
}

module.exports = FailPrefixReporter;

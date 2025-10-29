/**
 * Analyze verification logs and generate good placeholder values
 * Run this after Playwright tests to see OCR results
 */

const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', 'logs', 'verification-log.json');

if (!fs.existsSync(logFile)) {
    console.log('No verification log file found. Run tests first.');
    process.exit(1);
}

const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));

console.log('\n=== VERIFICATION LOG ANALYSIS ===\n');

// Group logs by image name
const imageGroups = {};
logs.forEach(log => {
    if (!imageGroups[log.imageName]) {
        imageGroups[log.imageName] = [];
    }
    imageGroups[log.imageName].push(log);
});

// Analyze each image
Object.keys(imageGroups).sort().forEach(imageName => {
    console.log(`\n📸 IMAGE: ${imageName}`);
    console.log('─'.repeat(80));
    
    const imageLogs = imageGroups[imageName];
    
    // Get the most recent log for this image
    const latestLog = imageLogs[imageLogs.length - 1];
    
    // Display OCR extracted text
    console.log('\n📝 OCR EXTRACTED TEXT:');
    console.log(latestLog.ocrText.substring(0, 500));
    if (latestLog.ocrText.length > 500) {
        console.log('... (truncated)');
    }
    
    // Display verification results
    console.log('\n✅ VERIFICATION RESULTS:');
    latestLog.results.forEach(result => {
        const status = result.found ? '✓' : '✗';
        const confidence = result.confidence ? ` (${(result.confidence * 100).toFixed(1)}% match)` : '';
        const inputValue = result.input || result.value || 'N/A';
        console.log(`  ${status} ${result.field}: "${inputValue}"${confidence}`);
        if (result.found && result.bestMatch) {
            console.log(`      Found in OCR: "${result.bestMatch}"`);
        }
    });
    
    // Suggest good values based on OCR text
    console.log('\n💡 SUGGESTED GOOD VALUES:');
    const suggestions = generateSuggestions(latestLog.ocrText, latestLog.results);
    Object.keys(suggestions).forEach(field => {
        console.log(`  ${field}: "${suggestions[field]}"`);
    });
});

console.log('\n' + '='.repeat(80) + '\n');

/**
 * Generate suggested values based on OCR text and verification results
 */
function generateSuggestions(ocrText, results) {
    const suggestions = {};
    
    // For fields that were found, use the found text
    results.forEach(result => {
        if (result.found && result.foundText) {
            suggestions[result.field] = result.foundText;
        }
    });
    
    // Try to extract common patterns from OCR text
    const lines = ocrText.split('\n').filter(line => line.trim());
    
    // Look for alcohol content pattern
    const alcoholMatch = ocrText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:ALC|ALCOHOL|VOL|ABV)/i);
    if (alcoholMatch && !suggestions['Alcohol Content']) {
        suggestions['Alcohol Content'] = `${alcoholMatch[1]}%`;
    }
    
    // Look for volume pattern
    const volumeMatch = ocrText.match(/(\d+)\s*(mL|ml|ML|L|oz|OZ)/i);
    if (volumeMatch && !suggestions['Net Contents']) {
        suggestions['Net Contents'] = `${volumeMatch[1]} ${volumeMatch[2]}`;
    }
    
    return suggestions;
}

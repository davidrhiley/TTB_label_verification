/**
 * Text Verification Module
 * Handles fuzzy text matching using Levenshtein distance algorithm
 */

class TextVerifier {
    /**
     * Calculate Levenshtein distance (edit distance) between two strings
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {number} Minimum edits needed to transform a into b
     */
    static levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        // Dynamic programming matrix
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));
        
        // Initialize first row and column
        for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        // Calculate distances
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = b[i - 1] === a[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + cost, // Substitution
                    matrix[i][j - 1] + 1,         // Insertion
                    matrix[i - 1][j] + 1          // Deletion
                );
            }
        }
        
        return matrix[b.length][a.length];
    }

    /**
     * Find best matching substring in text using fuzzy matching
     * @param {string} searchValue - Value to search for
     * @param {string} text - Text to search within
     * @returns {Object} Best match with distance, word, and confidence (0-1)
     */
    static findBestMatch(searchValue, text) {
        // Quick exact match check
        if (text.includes(searchValue)) {
            return { distance: 0, word: searchValue, confidence: 1.0 };
        }

        const words = text.split(/\s+/);
        let bestMatch = { distance: Infinity, word: null };
        
        // Test single words and short phrases
        for (let i = 0; i < words.length; i++) {
            // Single word
            let distance = this.levenshteinDistance(searchValue, words[i]);
            if (distance < bestMatch.distance) {
                bestMatch = { distance, word: words[i] };
            }

            // 2-3 word phrases
            for (let j = 1; j < 3 && i + j < words.length; j++) {
                const phrase = words.slice(i, i + j + 1).join(' ');
                distance = this.levenshteinDistance(searchValue, phrase);
                if (distance < bestMatch.distance) {
                    bestMatch = { distance, word: phrase };
                }
            }
        }

        // Convert distance to confidence score (0-1)
        const maxLength = Math.max(searchValue.length, bestMatch.word?.length || 0);
        const confidence = maxLength > 0 ? Math.max(0, 1 - (bestMatch.distance / maxLength)) : 0;
            
        return { ...bestMatch, confidence };
    }

    /**
     * Verify all form fields against extracted OCR text
     * @param {string} extractedText - OCR extracted text
     * @param {Object} fields - Form field values to verify
     * @param {Function} progressCallback - Progress callback (0-100%)
     * @returns {Promise<Array>} Verification results with confidence scores
     */
    async verifyText(extractedText, fields, progressCallback) {
        if (!extractedText) {
            throw new Error('No text extracted from image');
        }

        const results = [];
        const text = extractedText.toLowerCase();
        const fieldEntries = Object.entries(fields).filter(([_, value]) => value); // Skip empty fields
        const totalFields = fieldEntries.length;

        for (let i = 0; i < totalFields; i++) {
            const [fieldName, fieldValue] = fieldEntries[i];
            const searchValue = String(fieldValue).toLowerCase();
            const match = TextVerifier.findBestMatch(searchValue, text);
            
            results.push({
                field: fieldName,
                input: fieldValue,
                found: match.confidence > 0.7, // 70% threshold for match
                confidence: match.confidence,
                bestMatch: match.word
            });

            // Report progress
            if (progressCallback) {
                progressCallback(Math.round(((i + 1) / totalFields) * 100));
            }

            // Prevent UI blocking
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        return results;
    }

    /**
     * Display verification results in UI
     * @param {Array} results - Verification results to display
     */
    displayResults(results) {
        let container = document.getElementById('verificationResults');
        
        // Create container if it doesn't exist
        if (!container) {
            container = document.createElement('div');
            container.id = 'verificationResults';
            container.className = 'verification-results';
            document.querySelector('.preview-container')?.appendChild(container);
        }

        // Count failed results
        const failedCount = results.filter(result => !result.found).length;
        
        // Build HTML (single DOM write for performance)
        const html = `
            <h3>Verification Results</h3>
            <div id="verificationList">
                ${results.map(result => {
                    const confidence = (result.confidence * 100).toFixed(0);
                    const status = result.found ? 'match' : 'mismatch';
                    const label = result.field.replace(/([A-Z])/g, ' $1').trim();
                    
                    // Add explanation for failed results
                    let explanation = '';
                    if (!result.found) {
                        explanation = `
                            <div class="verification-explanation">
                                <strong>Expected:</strong> "${result.input}"<br>
                                <strong>Found in OCR:</strong> ${result.bestMatch ? `"${result.bestMatch}" (${confidence}% match)` : 'Not detected'}
                            </div>
                        `;
                    }
                    
                    return `
                        <div class="verification-item">
                            <span class="verification-label">${label}</span>
                            <div class="verification-details">
                                <span class="verification-confidence">${confidence}%</span>
                                <span class="verification-status status-${status}">
                                    ${result.found ? 'Match' : 'Not Found'}
                                </span>
                            </div>
                        </div>
                        ${explanation}
                    `;
                }).join('')}
            </div>
            ${failedCount > 2 ? `
                <div class="verification-recommendation">
                    <strong>⚠️ Recommendation:</strong> Multiple fields failed verification. 
                    Please consider:
                    <ul>
                        <li>Upload a higher quality or higher resolution image</li>
                        <li>Ensure the label is clearly visible and well-lit</li>
                        <li>Verify the form values match exactly what appears on the label</li>
                    </ul>
                </div>
            ` : ''}
        `;
        
        container.innerHTML = html;
        container.style.display = 'block';
    }
}

export const textVerifier = new TextVerifier();
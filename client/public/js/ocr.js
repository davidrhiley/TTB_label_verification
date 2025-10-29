/**
 * OCR Processing Module
 * Handles text extraction using Tesseract.js with multiple PSM configurations
 */

class OCRProcessor {
    constructor() {
        this.ready = true; // Using global Tesseract API - always ready
        
        // OCR configurations ordered by effectiveness for label text
        this.ocrConfigs = [
            {
                name: 'Sparse Text',
                params: {
                    tessedit_pageseg_mode: 11, // Best for labels with scattered text
                    tessedit_ocr_engine_mode: 1, // LSTM neural network
                    preserve_interword_spaces: '1'
                }
            },
            {
                name: 'Auto Detection',
                params: {
                    tessedit_pageseg_mode: 3, // Automatic page segmentation
                    tessedit_ocr_engine_mode: 1,
                    preserve_interword_spaces: '1'
                }
            },
            {
                name: 'Single Block',
                params: {
                    tessedit_pageseg_mode: 6, // Treat as single text block
                    tessedit_ocr_engine_mode: 1,
                    preserve_interword_spaces: '1'
                }
            },
            {
                name: 'Raw Line',
                params: {
                    tessedit_pageseg_mode: 13, // Single line fallback
                    tessedit_ocr_engine_mode: 2, // Legacy + LSTM combined
                    preserve_interword_spaces: '1'
                }
            }
        ];
    }

    async initialize() {
        return Promise.resolve(true);
    }

    /**
     * Normalize OCR text to fix common errors
     * @param {string} text - Raw OCR text
     * @returns {string} Normalized text
     */
    normalizeText(text) {
        if (!text) return '';
        
        let normalized = text;
        
        // Common OCR character substitution errors
        const charFixes = {
            '0': 'O',  // Zero to letter O in words
            '1': 'I',  // One to letter I in words
            '5': 'S',  // Five to letter S in words
            '8': 'B',  // Eight to letter B in words
            '|': 'I',  // Pipe to letter I
            '!': 'I',  // Exclamation to letter I
            '@': 'A',  // At symbol to A
            '()': 'O', // Parentheses to O
        };
        
        // Fix common number/letter confusions in alphabetic contexts
        // Only replace if surrounded by letters (not in numeric contexts)
        normalized = normalized.replace(/([A-Z])0([A-Z])/gi, '$1O$2'); // BOX not B0X
        normalized = normalized.replace(/([A-Z])1([A-Z])/gi, '$1I$2'); // WIN not W1N
        normalized = normalized.replace(/([A-Z])5([A-Z])/gi, '$1S$2'); // WHISKY not WHI5KY
        
        // Fix percentage sign errors
        normalized = normalized.replace(/(\d+)\s*o\/o/gi, '$1%'); // "40 o/o" → "40%"
        normalized = normalized.replace(/(\d+)\s*0\/0/gi, '$1%'); // "40 0/0" → "40%"
        
        // Fix "proof" variations
        normalized = normalized.replace(/pr[o0]{2}f/gi, 'proof'); // "pr00f" → "proof"
        normalized = normalized.replace(/pr[o0]of/gi, 'proof');   // "pro0f" → "proof"
        
        // Fix common word errors for alcohol labels
        normalized = normalized.replace(/wh[i1]sky/gi, 'whisky');
        normalized = normalized.replace(/wh[i1]skey/gi, 'whiskey');
        normalized = normalized.replace(/v[o0]dka/gi, 'vodka');
        normalized = normalized.replace(/t[e3]qu[i1]la/gi, 'tequila');
        normalized = normalized.replace(/b[o0]urb[o0]n/gi, 'bourbon');
        normalized = normalized.replace(/c[o0]gnac/gi, 'cognac');
        normalized = normalized.replace(/[b8]randy/gi, 'brandy');
        
        // Fix volume units
        normalized = normalized.replace(/m[li1]/gi, 'ml');
        normalized = normalized.replace(/[o0]z/gi, 'oz');
        
        // Remove excessive whitespace
        normalized = normalized.replace(/\s+/g, ' ').trim();
        
        // Remove nonsensical repeated characters (more than 3 in a row)
        normalized = normalized.replace(/(.)\1{3,}/g, '$1$1');
        
        return normalized;
    }

    /**
     * Process image with multiple OCR configurations
     * Returns the best result based on confidence and text length
     * @param {HTMLElement} image - Image or canvas element to process
     * @param {Function} progressCallback - Optional progress callback (0-100)
     * @returns {Promise<Object>} Best OCR result with text and confidence
     */
    async processImage(image, progressCallback) {
        let bestResult = null;
        const totalConfigs = this.ocrConfigs.length;
        
        for (let i = 0; i < totalConfigs; i++) {
            const config = this.ocrConfigs[i];
            
            try {
                const result = await Tesseract.recognize(image, 'eng', { 
                    ...config.params,
                    logger: m => {
                        if (progressCallback && m.status === 'recognizing text') {
                            const progress = ((i / totalConfigs) + (m.progress / totalConfigs)) * 100;
                            progressCallback(Math.round(progress));
                        }
                    }
                });

                const { text, confidence } = result.data;
                const normalizedText = this.normalizeText(text); // Apply normalization
                const score = confidence * Math.log(normalizedText.length + 1); // Weighted score

                if (!bestResult || score > (bestResult.confidence * Math.log(bestResult.text.length + 1))) {
                    bestResult = { text: normalizedText, confidence };
                }

                // Early exit if we have high confidence and sufficient text
                if (confidence > 80 && normalizedText.length > 50) break;
                
            } catch (error) {
                console.warn(`OCR failed with ${config.name}:`, error);
            }
        }

        if (!bestResult) {
            throw new Error('All OCR attempts failed');
        }

        return bestResult;
    }

    isReady() {
        return this.ready;
    }
}

export const ocrProcessor = new OCRProcessor();
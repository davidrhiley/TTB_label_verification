/**
 * Main Application Module
 * Orchestrates TTB label verification workflow
 */

import { imageProcessor } from './image-processor.js';
import { ocrProcessor } from './ocr.js';
import { formValidator } from './form-validator.js';
import { textVerifier } from './text-verifier.js';

class App {
    constructor() {
        this.state = { systemReady: false };
        this.submitButton = document.querySelector('button[type="submit"]');
    }

    /**
     * Initialize application
     */
    initialize() {
        this.initializeEventListeners();
        this.initializeSystems();
    }

    /**
     * Set up event listeners
     */
    initializeEventListeners() {
        formValidator.initialize();

        const imageUpload = document.getElementById('imageUpload');
        const uploadForm = document.getElementById('uploadForm');

        if (imageUpload) {
            imageUpload.addEventListener('change', this.handleImageUpload.bind(this));
        }

        if (uploadForm) {
            uploadForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
    }

    /**
     * Initialize OpenCV and Tesseract in parallel
     */
    async initializeSystems() {
        try {
            this.updateButtonState('Initializing systems...', true);
            
            const [cvResult, ocrResult] = await Promise.allSettled([
                imageProcessor.initialize(),
                ocrProcessor.initialize()
            ]);

            if (cvResult.status === 'rejected') {
                console.error('OpenCV init failed:', cvResult.reason);
                this.updateButtonState('OpenCV Init Failed', true);
                return;
            }

            if (ocrResult.status === 'rejected') {
                console.error('Tesseract init failed:', ocrResult.reason);
                this.updateButtonState('OCR Init Failed', true);
                return;
            }

            this.checkSystemReady();
        } catch (error) {
            console.error('System initialization failed:', error);
            this.updateButtonState('Initialization Failed', true);
        }
    }

    /**
     * Handle image upload and preview
     * @param {Event} e - Change event from file input
     */
    handleImageUpload(e) {
        const file = e.target.files[0];
        const imageInfo = document.getElementById('imageInfo');
        const preview = document.getElementById('imagePreview');
        const previewText = document.getElementById('previewText');
        
        if (imageInfo) {
            imageInfo.textContent = file?.name || 'No file selected';
        }
        
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
                previewText.style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
            previewText.textContent = 'No image selected';
            previewText.style.display = 'block';
        }
    }

    /**
     * Handle form submission and run verification workflow
     * @param {Event} e - Submit event
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            // Validate form fields
            if (!formValidator.validateAllFields()) {
                alert('Please fill in all required fields correctly');
                return;
            }

            const fields = formValidator.getFormData();
            const imageFile = document.getElementById('imageUpload').files[0];
            
            if (!imageFile) {
                throw new Error('Please select an image to verify');
            }

            // Ensure systems are initialized
            if (!this.state.systemReady) {
                this.updateButtonState('System initializing...', true);
                await this.initializeSystems();
            }

            if (!this.checkSystemReady()) {
                throw new Error('System initialization failed. Please refresh the page.');
            }

            // Start processing
            this.updateButtonState('Processing...', true);
            this.showProgress(10, 'Processing image...');

            // Step 1: Process image with OpenCV
            const preview = document.getElementById('imagePreview');
            const processedImage = await imageProcessor.processImage(preview);

            // Step 2: Perform OCR
            this.showProgress(40, 'Running OCR... 0%');
            const ocrResult = await ocrProcessor.processImage(processedImage, (progress) => {
                this.showProgress(40 + Math.round(progress * 0.3), `Running OCR... ${progress}%`);
            });

            // Step 3: Verify text
            this.showProgress(70, 'Verifying text...');
            const verificationResults = await textVerifier.verifyText(
                ocrResult.text, 
                fields, 
                (progress) => {
                    this.showProgress(70 + Math.round(progress * 0.3), `Verifying... ${progress}%`);
                }
            );
            
            // Complete
            this.showProgress(100, 'Done!');
            setTimeout(() => this.hideProgress(), 1200);

            // Display results
            textVerifier.displayResults(verificationResults);
            
            // Log to server
            await this.logVerificationResults(imageFile.name, fields, ocrResult.text, verificationResults);
            
            this.updateButtonState('Verify Label', false);

        } catch (error) {
            console.error('Verification error:', error);
            this.updateButtonState('Verify Label', false);
            this.hideProgress();
            alert('Error: ' + error.message);
        }
    }

    /**
     * Check if both systems are ready
     * @returns {boolean} True if ready
     */
    checkSystemReady() {
        this.state.systemReady = imageProcessor.isReady() && ocrProcessor.isReady();

        if (this.state.systemReady) {
            this.updateButtonState('Verify Label', false);
        }

        return this.state.systemReady;
    }

    /**
     * Update button state
     * @param {string} text - Button text
     * @param {boolean} disabled - Disabled state
     */
    updateButtonState(text, disabled = true) {
        if (this.submitButton) {
            this.submitButton.textContent = text;
            this.submitButton.disabled = disabled;
        }
    }

    /**
     * Show progress bar
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} text - Progress text
     */
    showProgress(percent, text) {
        const progressWrap = document.getElementById('verificationProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressWrap) progressWrap.style.display = 'block';
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = text;
    }

    /**
     * Hide progress bar
     */
    hideProgress() {
        const progressWrap = document.getElementById('verificationProgress');
        if (progressWrap) progressWrap.style.display = 'none';
    }

    /**
     * Log results to server
     */
    async logVerificationResults(imageName, fields, ocrText, results) {
        try {
            await fetch('http://localhost:3001/api/log-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageName,
                    fields,
                    ocrText,
                    results,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Logging failed:', error);
            // Don't throw - logging failure shouldn't break the app
        }
    }
}

// Initialize app when DOM is ready
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.initialize());
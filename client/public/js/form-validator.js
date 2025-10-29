/**
 * Form Validation Module
 * Validates TTB label form fields before submission
 */

class FormValidator {
    constructor() {
        // Field-specific validation patterns
        this.validationRules = {
            alcoholContent: {
                pattern: /^[0-9]+(\.[0-9]+)?\s*(%|proof)?$/i,
                message: 'Enter a valid number with optional % or proof (e.g., 40%, 80 proof, or 45)'
            },
            netContents: {
                // Flexible pattern for OCR errors (e.g., "2 1 PINTL" or "7 50 ML")
                pattern: /[0-9]+.*?(ml|mL|ML|l|L|liter|liters|oz|fl oz|fl\. oz\.|ounce|ounces|gal|gallon|gallons|pt|pint|pints|qt|quart|quarts|pintl)/i,
                message: 'Enter a valid volume (e.g., 750 mL, 25.4 oz)'
            }
        };
        this.initialized = false;
    }

    initialize() {
        this.initialized = true;
    }

    /**
     * Validate a single field
     * @param {HTMLElement} field - Input field to validate
     * @returns {boolean} True if valid
     */
    validateField(field) {
        const value = field.value.trim();
        
        // Check required fields
        if (!value) return false;
        
        // Apply field-specific rules if defined
        const rule = this.validationRules[field.id];
        if (rule && !rule.pattern.test(value)) {
            return false;
        }
        
        return true;
    }

    /**
     * Validate all required fields
     * @returns {boolean} True if all fields are valid
     */
    validateAllFields() {
        const fields = document.querySelectorAll('input[required]');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Get all form field values
     * @returns {Object} Form data object
     */
    getFormData() {
        return {
            brandName: document.getElementById('brandName')?.value || '',
            productClass: document.getElementById('productClass')?.value || '',
            alcoholContent: document.getElementById('alcoholContent')?.value || '',
            netContents: document.getElementById('netContents')?.value || '',
            manufacturerName: document.getElementById('manufacturerName')?.value || '',
            manufacturerAddress: document.getElementById('manufacturerAddress')?.value || ''
        };
    }
}

export const formValidator = new FormValidator();
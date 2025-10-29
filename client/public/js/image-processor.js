/**
 * Image Processing Module
 * Handles image preprocessing using OpenCV for optimal OCR results
 */

class ImageProcessor {
    constructor() {
        this.ready = false;
        this.initPromise = null;
    }

    /**
     * Initialize OpenCV (verifies it's loaded)
     * @returns {Promise} Resolves when OpenCV is ready
     */
    async initialize() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            if (window.cv) {
                this.ready = true;
                console.log('OpenCV initialized successfully');
                resolve();
            } else {
                reject(new Error('OpenCV not loaded. Ensure opencv.js is included in HTML.'));
            }
        });
        return this.initPromise;
    }

    /**
     * Process image with multiple preprocessing techniques
     * @param {HTMLImageElement} imageElement - Image element to process
     * @returns {Promise<HTMLCanvasElement>} Processed image canvas
     */
    processImage(imageElement) {
        return new Promise((resolve, reject) => {
            try {
                if (!cv) throw new Error('OpenCV is not initialized');

                const img = cv.imread(imageElement);
                const processedVersions = [];

                // Apply all preprocessing techniques
                const processors = [
                    { fn: this.basicThreshold, name: 'Basic OTSU' },
                    { fn: this.adaptiveThreshold, name: 'Adaptive Gaussian' },
                    { fn: this.highContrast, name: 'CLAHE + Adaptive' },
                    { fn: this.sharpen, name: 'Sharpening' },
                    { fn: this.denoise, name: 'Median Denoise' },
                    { fn: this.bilateralFilter, name: 'Bilateral Filter' },
                    { fn: this.morphologicalTextEnhancement, name: 'Morphological Enhancement' },
                    { fn: this.contrastStretching, name: 'Contrast Stretching' }
                ];

                processors.forEach(({ fn, name }, index) => {
                    console.log(`Processing version ${index + 1}: ${name}`);
                    processedVersions.push(fn.call(this, img));
                });

                // Create and display combined result
                this.displayCombinedImages(img, processedVersions);

                // Cleanup
                processedVersions.forEach(mat => mat.delete());
                img.delete();

                console.log('Image processing complete');
                resolve(document.getElementById('processedImage'));
            } catch (error) {
                console.error('Image processing error:', error);
                reject(error);
            }
        });
    }

    /**
     * Convert image to grayscale
     * @param {cv.Mat} img - Input image
     * @returns {cv.Mat} Grayscale image
     */
    toGrayscale(img) {
        const gray = new cv.Mat();
        cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);
        return gray;
    }

    /**
     * Basic OTSU threshold preprocessing
     */
    basicThreshold(img) {
        const gray = this.toGrayscale(img);
        const binary = new cv.Mat();
        cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
        gray.delete();
        return binary;
    }

    /**
     * Adaptive threshold with Gaussian blur
     */
    adaptiveThreshold(img) {
        const gray = this.toGrayscale(img);
        const blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);
        const binary = new cv.Mat();
        cv.adaptiveThreshold(blurred, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
        gray.delete();
        blurred.delete();
        return binary;
    }

    /**
     * High contrast using histogram equalization
     */
    highContrast(img) {
        const gray = this.toGrayscale(img);
        const enhanced = new cv.Mat();
        cv.equalizeHist(gray, enhanced);
        const binary = new cv.Mat();
        cv.adaptiveThreshold(enhanced, binary, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 15, 5);
        gray.delete();
        enhanced.delete();
        return binary;
    }

    /**
     * Sharpen image using convolution kernel
     */
    sharpen(img) {
        const gray = this.toGrayscale(img);
        const kernel = cv.Mat.ones(3, 3, cv.CV_32F);
        kernel.data32F[4] = 9; // Center
        for (let i = 0; i < 9; i++) {
            if (i !== 4) kernel.data32F[i] = -1;
        }
        const sharpened = new cv.Mat();
        cv.filter2D(gray, sharpened, -1, kernel);
        const binary = new cv.Mat();
        cv.threshold(sharpened, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
        gray.delete();
        kernel.delete();
        sharpened.delete();
        return binary;
    }

    /**
     * Denoise using median blur and morphological operations
     */
    denoise(img) {
        const gray = this.toGrayscale(img);
        const denoised = new cv.Mat();
        cv.medianBlur(gray, denoised, 3);
        const binary = new cv.Mat();
        cv.threshold(denoised, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        const cleaned = new cv.Mat();
        cv.morphologyEx(binary, cleaned, cv.MORPH_OPEN, kernel);
        gray.delete();
        denoised.delete();
        binary.delete();
        kernel.delete();
        return cleaned;
    }

    /**
     * Bilateral filter - preserves edges while removing noise
     */
    bilateralFilter(img) {
        const gray = this.toGrayscale(img);
        const filtered = new cv.Mat();
        cv.bilateralFilter(gray, filtered, 9, 75, 75);
        const binary = new cv.Mat();
        cv.threshold(filtered, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
        gray.delete();
        filtered.delete();
        return binary;
    }

    /**
     * CLAHE + morphological text enhancement
     * Best for labels with varying lighting
     */
    morphologicalTextEnhancement(img) {
        const gray = this.toGrayscale(img);
        const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
        const enhanced = new cv.Mat();
        clahe.apply(gray, enhanced);
        const binary = new cv.Mat();
        cv.adaptiveThreshold(enhanced, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 1));
        const closed = new cv.Mat();
        cv.morphologyEx(binary, closed, cv.MORPH_CLOSE, kernel);
        gray.delete();
        enhanced.delete();
        binary.delete();
        kernel.delete();
        return closed;
    }

    /**
     * Contrast stretching (Histogram normalization)
     * Expands the dynamic range of pixel intensities for better text visibility
     */
    contrastStretching(img) {
        const gray = this.toGrayscale(img);
        
        // Normalize histogram to stretch contrast to full range [0, 255]
        const normalized = new cv.Mat();
        cv.normalize(gray, normalized, 0, 255, cv.NORM_MINMAX);
        
        // Apply threshold after normalization
        const binary = new cv.Mat();
        cv.threshold(normalized, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
        
        gray.delete();
        normalized.delete();
        return binary;
    }

    /**
     * Display all processed versions in a grid
     * @param {cv.Mat} img - Original image
     * @param {Array<cv.Mat>} versions - Array of processed images
     */
    displayCombinedImages(img, versions) {
        const cols = 2;
        const displayWidth = img.cols * cols;
        const displayHeight = Math.ceil(versions.length / cols) * img.rows;
        const display = new cv.Mat(displayHeight, displayWidth, cv.CV_8UC1, new cv.Scalar(255));

        versions.forEach((version, index) => {
            const x = (index % cols) * img.cols;
            const y = Math.floor(index / cols) * img.rows;
            const roi = display.roi(new cv.Rect(x, y, img.cols, img.rows));
            version.copyTo(roi);
        });

        cv.imshow('processedImage', display);
        document.getElementById('processedImage').style.display = 'block';
        display.delete();
    }

    isReady() {
        return this.ready;
    }
}

export const imageProcessor = new ImageProcessor();
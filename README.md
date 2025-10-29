# TTB Label Verification System

A full-stack application for verifying alcohol beverage labels against TTB (Alcohol and Tobacco Tax and Trade Bureau) requirements using OCR and fuzzy text matching.

## Features

- **Image Preprocessing**: 8 different OpenCV preprocessing techniques optimized for text extraction
- **Multi-Config OCR**: Tesseract.js 5.1.1 with 4 PSM modes for optimal text recognition
- **OCR Text Normalization**: Automatic correction of common OCR errors (character substitutions, word fixes)
- **Fuzzy Matching**: Levenshtein distance algorithm for flexible text verification
- **Real-time Verification**: Live verification results with confidence scores
- **Detailed Feedback**: Explanations for failed verifications showing expected vs found values
- **Smart Recommendations**: Actionable suggestions when multiple fields fail verification
- **Logging System**: Server-side logging and analysis of verification results
- **Automated Testing**: Playwright test suite with 10 tests and screenshot capture for failures

## Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6 Modules)
- OpenCV.js 4.10.0 (image preprocessing)
- Tesseract.js 5.1.1 (OCR)

**Backend:**
- Node.js + Express
- File-based JSON logging

**Testing:**
- Playwright (end-to-end testing)

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. **Clone or download the repository**

2. **Install dependencies**

```bash
npm install
```

This will install both server and client dependencies.

## Running the Application

### 1. Start the Server

```bash
npm start
```

**Or if you encounter PowerShell script execution policy issues:**

```bash
cd server
node server.js
```

**Alternative (if npm scripts work on your system):**

```bash
npm start
```

The server will start on `http://localhost:3001`

### 2. Open in Browser

Navigate to `http://localhost:3001` in your web browser.

> **Note:** The application uses a single-page vanilla JavaScript architecture. All OCR processing happens client-side using OpenCV.js and Tesseract.js for optimal performance.

## How to Use

### Manual Verification

1. **Upload an alcohol beverage label image**
   - Click the upload area or drag and drop an image
   - Supported formats: JPG, PNG, WEBP

2. **Fill in the form fields**
   - Brand Name (e.g., "ABC")
   - Product Class/Type (e.g., "STRAIGHT RYE WHISKY")
   - Alcohol Content (e.g., "45%" or "80 proof")
   - Net Contents (e.g., "750 ML" or "1 PINT")
   - Manufacturer/Bottler Name (e.g., "ABC DISTILLERY")
   - Address (e.g., "Frederick, MD")

3. **Click "Verify Label"**
   - The system will process the image using 7 preprocessing techniques
   - OCR will extract text using 4 different configurations
   - Results will show match confidence for each field

4. **Review Results**
   - Green checkmark = Match (>70% confidence)
   - Red X = Not found
   - Confidence percentage shown for each field
   - Failed verifications include explanations showing expected vs found values
   - **Recommendation Box**: If more than 2 fields fail, a warning appears with suggestions:
     - Upload a higher quality/resolution image
     - Ensure the label is clearly visible and well-lit
     - Verify form values match exactly what appears on the label

## Running Tests

### Prerequisites for Testing

Before running tests, ensure:
1. Server is **not** running (tests will start their own server instance)
2. Playwright browsers are installed:
   ```bash
   npx playwright install
   ```

### Automated Playwright Tests

The test suite includes **10 automated end-to-end tests** that verify the entire verification workflow:
- 5 tests with **correct values** (expects "Match" status)
- 5 tests with **incorrect values** (expects "Not Found" status)

Each test:
1. Uploads a test image
2. Fills in form fields (good or bad values)
3. Submits the form
4. Waits for OCR processing (up to 90 seconds)
5. Captures screenshot for debugging
6. Validates verification results with assertions

**Run all tests:**
```bash
npm test
```

**Or if you encounter PowerShell script execution policy issues:**
```bash
node node_modules/@playwright/test/cli.js test
```

Expected output: All 10 tests should pass (takes 5-10 minutes total).

### Run Tests with UI (Interactive Mode)

View tests running in real-time with Playwright's UI:

```bash
npx playwright test --ui
```

**Or:**
```bash
node node_modules/@playwright/test/cli.js test --ui
```

This opens an interactive browser where you can:
- Watch each test step-by-step
- Debug failing tests
- Inspect DOM elements
- View screenshots

### Run Specific Test

```bash
# Run tests for a specific image
npx playwright test --grep "brand-label-ABC"
# Or: node node_modules/@playwright/test/cli.js test --grep "brand-label-ABC"

# Run only good values tests
npx playwright test --grep "good values"
# Or: node node_modules/@playwright/test/cli.js test --grep "good values"

# Run only bad values tests
npx playwright test --grep "bad values"
# Or: node node_modules/@playwright/test/cli.js test --grep "bad values"
```

### Test Images

The test suite includes 5 sample alcohol beverage labels:
- `brand-label-ABC.jpg` - Whisky label (best OCR results)
- `malt-beverage-alcohol-content-1.png` - Ale label
- `malt-beverage-alcohol-content-4.png` - Pale ale label
- `r1y4srfxyxq5gvbevd6qhvh5aj_image.jpg` - Rum label
- `winelabel-example-600x480.webp` - Wine label

### Understanding Test Results

**Good Values Tests** validate that correct information is matched:
- ✅ Expects "Match" text in results
- ✅ Expects 6 verification items displayed
- ✅ Green checkmarks for matched fields

**Bad Values Tests** validate that incorrect information is detected:
- ✅ Expects "Not Found" text in results
- ✅ Expects 6 verification items displayed
- ✅ At least 4 out of 6 fields show red X (mismatch)

### Test Screenshots and Debugging

Playwright captures screenshots and trace files for failed tests only:
- **Screenshots**: Full-page screenshots attached to each failed test
- **Trace files**: Detailed execution traces for debugging
- **Test artifacts**: Saved in `test-results/` with `FAIL-` prefix

**View test artifacts:**
```bash
# Screenshots and traces are in:
test-results/FAIL-<test-name>/
```

**View trace files for detailed debugging:**
```bash
npx playwright show-trace test-results/FAIL-<test-name>/trace.zip
```

**Clean up test results:**
```bash
# Windows PowerShell
Remove-Item test-results\* -Recurse -Force

# Or manually delete the folder contents
```

### Troubleshooting Tests

**Tests timeout or fail:**
- OCR processing can take 60-90 seconds per image
- Ensure adequate system resources (CPU/RAM)
- Check `test-results/FAIL-*/` folders for screenshots and traces
- View trace files: `npx playwright show-trace <path-to-trace.zip>`

**"Browser not installed" error:**
```bash
npx playwright install chromium
# Or: node node_modules/@playwright/test/cli.js install chromium
```

**Server connection refused:**
- Make sure the server is running on port 3001 before running tests
- Start server: `cd server && node server.js`
- Check server is running: navigate to `http://localhost:3001/ping`

**PowerShell execution policy errors:**
- Use the node commands directly instead of npm/npx
- Example: `node node_modules/@playwright/test/cli.js test`

## Analyzing Test Results

After running tests, analyze the verification logs:

```bash
node server/scripts/analyze-logs.js
```

This will display:
- OCR extracted text for each image
- Verification results with confidence scores
- Suggested good values based on OCR output

### Clear Logs

```bash
node server/scripts/analyze-logs.js --clear
```

## Project Structure

```
TTB_label_verification/
├── client/
│   ├── public/
│   │   ├── index.html              # Main UI
│   │   ├── style.css               # Styling
│   │   ├── images/                 # TTB seal and assets
│   │   └── js/                     # Client-side JavaScript modules
│   │       ├── app.js              # Main application orchestration
│   │       ├── form-validator.js   # Form validation
│   │       ├── image-processor.js  # OpenCV preprocessing (8 techniques)
│   │       ├── ocr.js              # Tesseract OCR processing (4 PSM modes)
│   │       └── text-verifier.js    # Fuzzy text matching & verification
│   ├── package.json                # Client dependencies (http-server)
│   └── node_modules/
├── server/
│   ├── server.js                   # Express server with API endpoints
│   ├── logs/
│   │   └── verification-log.json   # Verification results (auto-generated)
│   ├── scripts/
│   │   ├── analyze-logs.js         # Log analysis tool
│   │   └── create_test_files.js    # Test file generator
│   ├── test-files/                 # 5 sample label images for testing
│   ├── package.json                # Server dependencies
│   └── node_modules/
├── test-results/                   # Test artifacts (only failed tests with FAIL- prefix)
├── node_modules/                   # Root dependencies
├── global-teardown.js              # Playwright cleanup script
├── playwright.spec.js              # 10 E2E tests (5 good, 5 bad values)
├── playwright.config.js            # Playwright test configuration
├── custom-reporter.js              # Custom reporter to add FAIL- prefix
├── package.json                    # Root package (Playwright)
└── README.md                       # This file
```

### Architecture Notes

- **Client-side OCR**: All image processing and OCR happens in the browser using WebAssembly (OpenCV.js, Tesseract.js)
- **Vanilla JavaScript**: No framework dependencies - uses ES6 modules
- **Minimal Server**: Express server only serves static files and logs results
- **Test Coverage**: Playwright tests cover full workflow with visual regression

## API Endpoints

### POST `/api/log-verification`
Log verification results to server

**Request Body:**
```json
{
  "imageName": "label.jpg",
  "fields": {...},
  "ocrText": "extracted text",
  "results": [...]
}
```

### GET `/api/verification-logs`
Retrieve all verification logs

### DELETE `/api/verification-logs`
Clear all verification logs

### GET `/ping`
Health check endpoint

## Configuration

### OpenCV Preprocessing Techniques

1. **Basic OTSU** - Simple thresholding
2. **Adaptive Gaussian** - Handles varying lighting
3. **CLAHE** - Contrast enhancement with adaptive histogram equalization
4. **Sharpening** - Edge enhancement for clearer text
5. **Median Denoise** - Noise removal with morphological operations
6. **Bilateral Filter** - Edge-preserving smoothing
7. **Morphological Enhancement** - Text character connection using CLAHE + closing
8. **Contrast Stretching** - Histogram normalization to expand dynamic range

### OCR Text Normalization

Automatically fixes common OCR errors:

**Character Substitutions:**
- Numbers to letters in words: `B0X` → `BOX`, `W1N` → `WIN`, `WHI5KY` → `WHISKY`
- Special characters: `|` → `I`, `@` → `A`

**Percentage Fixes:**
- `40 o/o` → `40%`, `40 0/0` → `40%`

**Common Word Corrections:**
- `wh1sky`/`wh1skey` → `whisky`/`whiskey`
- `v0dka` → `vodka`, `b0urb0n` → `bourbon`
- `pr00f` → `proof`, `8randy` → `brandy`

**Volume Units:**
- `m1`/`mi` → `ml`, `0z` → `oz`

**Cleanup:**
- Removes excessive whitespace and repeated characters

### Tesseract PSM Modes

1. **PSM 11** - Sparse text (best for labels)
2. **PSM 3** - Auto page segmentation
3. **PSM 6** - Single block of text
4. **PSM 13** - Raw line with fallback engine

## Troubleshooting

### OCR Returns Poor Results
- Ensure image has good resolution (min 300x300px recommended)
- Check that text is clearly visible and well-lit
- The system tries 8 preprocessing techniques automatically
- View browser console for OCR progress and extracted text

### Validation Fails
- **Alcohol Content**: Must be a valid number, optionally with "%" or "proof" (e.g., "45%", "80 proof", or "40")
- **Net Contents**: Must include volume unit (mL, L, oz, pint, quart, gallon)
- **All fields**: Required and must not be empty
- Check validation patterns in `client/public/js/form-validator.js`

### Server Won't Start
```bash
# Check if port 3001 is available (Windows)
netstat -ano | findstr :3001

# Kill process if needed (Windows PowerShell)
taskkill /PID <PID> /F

# Try starting on a different port
$env:PORT=3002; node server/server.js
```

### PowerShell Script Execution Policy
If you see "cannot be loaded because running scripts is disabled":

**Option 1: Use node commands directly (recommended)**
```powershell
node server/server.js
node node_modules/@playwright/test/cli.js test
```

**Option 2: Enable scripts (requires admin)**
```powershell
Set-ExecutionPolicy RemoteSigned
```

### Tests Fail to Connect
```bash
# 1. Make sure server is running
cd server
node server.js

# 2. Verify server is accessible
# Open browser: http://localhost:3001/ping
# Should return: {"ok":true}

# 3. Then run tests in a new terminal
node node_modules/@playwright/test/cli.js test
```

### Playwright Browsers Not Installed
```bash
# Install Playwright browsers
npx playwright install chromium
# Or: node node_modules/@playwright/test/cli.js install chromium
```

## Performance Notes

- OCR processing takes 10-30 seconds depending on image complexity
- Multiple preprocessing techniques ensure best text extraction
- Early exit optimization if confidence >80% and text length >50 chars

## License

MIT

## Author

David (DOT Takehome Project)

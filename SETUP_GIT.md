# Git Setup Instructions

## Prerequisites
1. Install Git from: https://git-scm.com/download/win
2. Create a new repository on GitHub (don't initialize with README)
3. Copy the repository URL (e.g., `https://github.com/yourusername/TTB_label_verification.git`)

## Commands to Run

### 1. Initialize Git Repository
```powershell
git init
```

### 2. Add All Files
```powershell
git add .
```

### 3. Create Initial Commit
```powershell
git commit -m "Initial commit: TTB Label Verification System"
```

### 4. Add Remote Repository
Replace `YOUR_GITHUB_URL` with your actual GitHub repository URL:
```powershell
git remote add origin YOUR_GITHUB_URL
```

### 5. Push to GitHub
```powershell
git branch -M main
git push -u origin main
```

## Alternative: Using VS Code
1. Open this folder in VS Code
2. Click the Source Control icon (left sidebar)
3. Click "Initialize Repository"
4. Stage all changes (+ icon)
5. Enter commit message: "Initial commit: TTB Label Verification System"
6. Click the checkmark to commit
7. Click "Publish Branch" and select your GitHub account
8. Choose repository name and visibility (public/private)

## What Will Be Committed

### Included:
- Source code (client/, server/)
- Configuration files (package.json, playwright.config.js, etc.)
- Test files (playwright.spec.js, custom-reporter.js, global-teardown.js)
- Documentation (README.md)
- Dependencies (package-lock.json files)
- .gitignore and .gitkeep files

### Excluded (via .gitignore):
- node_modules/
- .env
- test-results/
- server/logs/*.json
- Temporary and OS-specific files

## After Pushing

Your repository will be available at:
`https://github.com/yourusername/TTB_label_verification`

You can then:
- Add a repository description
- Add topics/tags (javascript, ocr, tesseract, playwright, opencv)
- Enable GitHub Pages (if desired)
- Set up GitHub Actions for CI/CD (optional)

# Outlook AI Reply — Web Add-in Setup

## Prerequisites
- Node.js 18+ (https://nodejs.org)
- A GitHub account

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally for testing
```bash
npm run dev
```
This starts at https://localhost:3000 — trust the certificate when prompted.

### 3. Sideload in Outlook
- Open Outlook (classic or new)
- Go to **Home → Get Add-ins → My Add-ins → Add a custom add-in → Add from file**
- Select `public/manifest.xml`
- The **AI Reply** button appears in your ribbon

### 4. Deploy to GitHub Pages
```bash
# Build
npm run build

# In your GitHub repo settings → Pages → set source to /dist branch
# Or use gh-pages package:
npm install -g gh-pages
gh-pages -d dist
```

### 5. Update manifest.xml
Replace all `YOUR_GITHUB_USERNAME` in `public/manifest.xml` with your actual GitHub username.

## Configuration
On first use, click **Settings** in the ribbon to configure:
- Choose your LLM provider (Anthropic, OpenAI, Google, or Ollama)
- Enter your API key
- Set your persona/role
- Add custom reply instructions

#!/bin/bash
# GoldsteinCMS Customer Onboarding Script
# This script sets up a new customer instance using the shared core pattern.
#
# Usage: ./onboard.sh <customer-name> [core-repo-url] [core-version]
#
# Example:
#   ./onboard.sh my-organization https://github.com/KaiNeumann/goldstein-core.git v1.2.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
CORE_REPO="${2:-https://github.com/KaiNeumann/GoldsteinCMS.git}"
CORE_VERSION="${3:-main}"
CUSTOMER_NAME="${1}"

# Validate input
if [ -z "$CUSTOMER_NAME" ]; then
    echo -e "${RED}Error: Customer name is required${NC}"
    echo "Usage: $0 <customer-name> [core-repo-url] [core-version]"
    exit 1
fi

echo -e "${GREEN}GoldsteinCMS Customer Onboarding${NC}"
echo "================================"
echo ""
echo "Customer: ${CUSTOMER_NAME}"
echo "Core repo: ${CORE_REPO}"
echo "Core version: ${CORE_VERSION}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    exit 1
fi

# Check if node/npm is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: node is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Create customer directory
echo -e "${YELLOW}Step 1: Creating customer directory...${NC}"
mkdir -p "${CUSTOMER_NAME}"
cd "${CUSTOMER_NAME}"

# Initialize git repository
echo -e "${YELLOW}Step 2: Initializing git repository...${NC}"
git init
git checkout -b main

# Add core submodule
echo -e "${YELLOW}Step 3: Adding core submodule...${NC}"
git submodule add "${CORE_REPO}" core
cd core
git checkout "${CORE_VERSION}"
cd ..

# Create site.json from template
echo -e "${YELLOW}Step 4: Creating site.json from template...${NC}"
if [ -f "core/templates/site.json.example" ]; then
    cp core/templates/site.json.example site.json
    echo -e "${GREEN}Created site.json - please customize for your customer${NC}"
else
    echo -e "${YELLOW}Warning: core/templates/site.json.example not found${NC}"
    echo "Please create site.json manually"
fi

# Create package.json from template
echo -e "${YELLOW}Step 5: Creating package.json...${NC}"
if [ -f "core/templates/package.json.example" ]; then
    cp core/templates/package.json.example package.json
    # Update package name
    sed -i "s/goldsteincms-customer/${CUSTOMER_NAME}/g" package.json 2>/dev/null || \
    sed -i '' "s/goldsteincms-customer/${CUSTOMER_NAME}/g" package.json 2>/dev/null || true
    echo -e "${GREEN}Created package.json${NC}"
else
    echo -e "${YELLOW}Warning: core/templates/package.json.example not found${NC}"
    echo "Please create package.json manually"
fi

# Create Dependabot config
echo -e "${YELLOW}Step 6: Creating Dependabot config...${NC}"
mkdir -p .github
if [ -f "core/templates/dependabot.yml.example" ]; then
    cp core/templates/dependabot.yml.example .github/dependabot.yml
    echo -e "${GREEN}Created .github/dependabot.yml${NC}"
else
    echo -e "${YELLOW}Warning: core/templates/dependabot.yml.example not found${NC}"
fi

# Create basic project structure
echo -e "${YELLOW}Step 7: Creating project structure...${NC}"
mkdir -p src/pages
mkdir -p public/images

# Create basic index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GoldsteinCMS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Create basic src/index.css with theme overrides
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Override these colors for your customer's brand */
  --color-primary: #2d6a1e;
  --color-primary-dark: #1a4d0f;
  --color-primary-light: #4a8c34;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
EOF

# Create basic src/main.tsx
cat > src/main.tsx << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create basic src/App.tsx
cat > src/App.tsx << 'EOF'
import { HashRouter, Routes, Route } from "react-router-dom";
import { ContentProvider } from "goldstein-core/context/ContentContext";
import Layout from "goldstein-core/components/Layout";
import { site } from "goldstein-core/siteConfig";
import { pageRegistry } from "goldstein-core/pageRegistry";
import { initTheme } from "goldstein-core/components/ThemeToggle";

initTheme();

export default function App() {
  return (
    <ContentProvider>
      <HashRouter>
        <Layout>
          <Routes>
            {Object.entries(site.pages).map(([path, { component }]) => {
              const Component = pageRegistry[component];
              return Component ? (
                <Route key={path} path={path} element={<Component />} />
              ) : null;
            })}
            <Route path="*" element={pageRegistry.Home ? <pageRegistry.Home /> : null} />
          </Routes>
        </Layout>
      </HashRouter>
    </ContentProvider>
  );
}
EOF

# Create basic vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "goldstein-core": path.resolve(__dirname, "./core/src"),
    },
  },
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
  },
});
EOF

# Create basic tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"],
      "goldstein-core/*": ["./core/src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Create basic .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Build output
dist/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
EOF

# Install dependencies
echo -e "${YELLOW}Step 8: Installing dependencies...${NC}"
npm install

# Initialize git and make initial commit
echo -e "${YELLOW}Step 9: Creating initial commit...${NC}"
git add -A
git commit -m "feat: initial customer setup with GoldsteinCMS core"

echo ""
echo -e "${GREEN}Onboarding complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit site.json to configure navigation, sidebar, footer, and pages"
echo "  2. Edit src/index.css to customize theme colors"
echo "  3. Add customer-specific page components in src/pages/"
echo "  4. Configure Cloudflare Pages environment variables"
echo "  5. Push to your GitHub repository"
echo ""
echo "For more information, see docs/SHARED-CORE.md"

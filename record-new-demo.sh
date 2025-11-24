#!/bin/bash

# NeuroLint 5-Act Demo Recording Script
# This script simulates the terminal commands for the demo

# Function to simulate typing
type_command() {
    echo "$1"
}

# Function to add pause
pause() {
    sleep "$1"
}

clear

# Act 1: The Pain (30-45 seconds)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Act 1: The Pain"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
pause 2

type_command "$ cd ~/projects/ecommerce-app"
pause 1

type_command "$ npm run dev"
pause 1.5
echo ""
echo "Error: Hydration failed because the initial UI does not match"
echo "what was rendered on the server."
echo "  × window is not defined"
echo "    at Dashboard (./pages/dashboard.tsx:5:15)"
echo ""
pause 2

type_command "$ npm run lint"
pause 1
echo ""
echo "✖ 8 problems (5 errors, 3 warnings)"
echo ""
echo "  pages/dashboard.tsx"
echo "    3:16  error  'useState' is not defined        no-undef"
echo "    5:15  error  'window' is not defined          no-undef"
echo ""
echo "  components/TodoList.tsx"
echo "    4:3   error  Unexpected var, use let or const  no-var"
echo "    8:9   error  Missing key prop for element      react/jsx-key"
echo "    11:13 warning Unexpected console statement      no-console"
echo ""
pause 3

# Act 2: The Analysis (15-20 seconds)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Act 2: The Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
pause 2

type_command "$ neurolint analyze . --verbose"
pause 1
echo "Running analyze......"
pause 1.5
echo ""
echo "[ANALYSIS SUMMARY]"
echo "  Files Analyzed: 3"
echo "  Total Issues Found: 12"
echo "  Layer Recommendations:"
echo "    Layer 4 (Hydration): 1 file"
echo "    Layer 3 (Components): 2 files"
echo "    Layer 2 (Patterns): 3 files"
echo "[COMPLETE] Analysis completed"
echo ""
pause 3

# Act 3: The Fix (40-60 seconds)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Act 3: The Fix - Hydration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
pause 2

type_command "$ neurolint fix pages/dashboard.tsx -l 4 --verbose"
pause 1
echo "Running Layer 4 (Hydration Fixes)"
echo "[INFO] Detected direct window access in component"
echo "[INFO] Wrapping in useEffect to prevent SSR hydration errors"
echo "[SUCCESS] Layer 4 applied 2 hydration fixes"
echo ""
pause 2

type_command "$ git diff pages/dashboard.tsx"
pause 1
echo "diff --git a/pages/dashboard.tsx b/pages/dashboard.tsx"
echo "--- a/pages/dashboard.tsx"
echo "+++ b/pages/dashboard.tsx"
echo "@@ -2,8 +2,13 @@"
echo "-  const theme = window.localStorage.getItem('theme') || 'light'"
echo "   const [count, setCount] = useState(0)"
echo "+  const [theme, setTheme] = useState('light')"
echo "+  "
echo "+  useEffect(() => {"
echo "+    setTheme(window.localStorage.getItem('theme') || 'light')"
echo "+  }, [])"
echo ""
pause 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Act 3: The Fix - Components"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
pause 2

type_command "$ neurolint fix components/TodoList.tsx -l 2,3 --verbose"
pause 1
echo "Running Layer 2 (Pattern Fixes)"
echo "[SUCCESS] Layer 2 applied 2 pattern fixes"
echo "Running Layer 3 (Component Fixes)"
echo "[INFO] Added missing key props to 3 JSX elements"
echo "[INFO] Removed console.log statements"
echo "[SUCCESS] Layer 3 applied 4 component fixes"
echo ""
echo "[FIXED] components/TodoList.tsx"
echo "  Execution Time: 168ms"
echo "  Applied Fixes: 6"
echo ""
pause 3

# Act 4: The Proof (15-20 seconds)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Act 4: The Proof"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
pause 2

type_command "$ npm run dev"
pause 1
echo ""
echo "▲ Next.js 14.2.0"
echo "  - Local:   http://localhost:3000"
echo "  - Ready in 1.2s"
echo ""
pause 2

type_command "$ npm run lint"
pause 1
echo ""
echo "✔ No ESLint warnings or errors"
echo ""
pause 2

# Act 5: The Closer (10 seconds)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Act 5: Success!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
pause 1

type_command "# Hydration crashes: Fixed ✓"
pause 0.5
type_command "# Missing keys: Fixed ✓"
pause 0.5
type_command "# ESLint errors: Fixed ✓"
pause 0.5
type_command "# Deploy blockers: Fixed ✓"
pause 1
echo ""
type_command "$ npm install -g @neurolint/cli"
echo ""
pause 2

echo ""
echo "🎉 Demo Complete! NeuroLint fixed your code in seconds."
echo ""

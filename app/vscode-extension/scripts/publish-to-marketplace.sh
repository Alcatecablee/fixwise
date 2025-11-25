#!/bin/bash

# NeuroLint VS Code Extension - Marketplace Publishing Script

set -e

echo "🚀 NeuroLint VS Code Extension - Marketplace Publishing"
echo "======================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the vscode-extension directory"
    exit 1
fi

# Check if vsce is installed
if ! command -v vsce &> /dev/null; then
    echo "📦 Installing vsce (Visual Studio Code Extension Manager)..."
    npm install -g vsce
fi

echo "🔍 Pre-publish checks..."

# Check if required files exist
REQUIRED_FILES=("README.md" "CHANGELOG.md" "package.json" "media/icon.svg")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ All required files present"

# Validate package.json
echo "🔍 Validating package.json..."
node -e "
const pkg = require('./package.json');
const required = ['name', 'displayName', 'description', 'version', 'publisher', 'engines'];
const missing = required.filter(field => !pkg[field]);
if (missing.length > 0) {
    console.error('❌ Missing required fields in package.json:', missing.join(', '));
    process.exit(1);
}
console.log('✅ package.json validation passed');
"

# Build the extension
echo "🔨 Building extension..."
npm run clean
npm run build

# Package the extension
echo "📦 Packaging extension..."
vsce package --out ./dist/

echo "✅ Extension packaged successfully!"

# Get the package file name
PACKAGE_FILE=$(ls dist/*.vsix | head -n1)
if [ -z "$PACKAGE_FILE" ]; then
    echo "❌ No .vsix file found in dist/"
    exit 1
fi

echo "📋 Package Information:"
echo "   File: $PACKAGE_FILE"
echo "   Size: $(ls -lh "$PACKAGE_FILE" | awk '{print $5}')"

# Test the package
echo "🧪 Testing package integrity..."
vsce show "$PACKAGE_FILE"

echo ""
echo "🎉 Extension is ready for marketplace!"
echo ""
echo "Next steps:"
echo "1. Test the extension locally:"
echo "   code --install-extension $PACKAGE_FILE"
echo ""
echo "2. Publish to marketplace (requires publisher account):"
echo "   vsce login <your-publisher-name>"
echo "   vsce publish"
echo ""
echo "3. Or upload manually:"
echo "   Visit: https://marketplace.visualstudio.com/manage"
echo "   Upload: $PACKAGE_FILE"
echo ""
echo "📚 Documentation:"
echo "   - Publisher setup: https://code.visualstudio.com/api/working-with-extensions/publishing-extension"
echo "   - Marketplace guide: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher"

#!/bin/bash

# Script to record NeuroLint demo

# Clear screen
clear

# Show the header
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NeuroLint CLI Demo - Automatic Code Fixes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
sleep 2

# Show the problematic file
echo "📄 Original file (demo-example.jsx):"
echo ""
sleep 1
cat demo-example.jsx
echo ""
sleep 3

# Analyze the file
echo ""
echo "🔍 Analyzing code for issues..."
sleep 1
npx neurolint analyze demo-example.jsx --format=text
echo ""
sleep 3

# Fix the file
echo ""
echo "🔧 Fixing issues with layers 1-4..."
sleep 1
npx neurolint fix demo-example.jsx -l 1,2,3,4 --verbose
echo ""
sleep 2

# Show the fixed file
echo ""
echo "✅ Fixed file:"
echo ""
sleep 1
cat demo-example.jsx
echo ""
sleep 2

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✨ Code automatically fixed in seconds!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
sleep 2

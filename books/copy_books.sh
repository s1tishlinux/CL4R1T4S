#!/bin/bash

LEARNING_DIR="/Users/satishgundu/Downloads/@ @1. Satish Office personal /16. Learning & Notes"
TARGET_DIR="/Users/satishgundu/CL4R1T4S-main/books"

echo "📚 Copying technical books to $TARGET_DIR..."
echo ""

# Create category folders
mkdir -p "$TARGET_DIR/DevOps"
mkdir -p "$TARGET_DIR/Python"
mkdir -p "$TARGET_DIR/GenAI"
mkdir -p "$TARGET_DIR/Kubernetes"
mkdir -p "$TARGET_DIR/MLOps"

# Copy DevOps books
find "$LEARNING_DIR" -type f -iname "*devops*" -iname "*.pdf" -exec cp {} "$TARGET_DIR/DevOps/" \; 2>/dev/null
echo "✓ Copied DevOps books"

# Copy Python books
find "$LEARNING_DIR" -type f -iname "*python*" -iname "*.pdf" -exec cp {} "$TARGET_DIR/Python/" \; 2>/dev/null
echo "✓ Copied Python books"

# Copy GenAI/ML books
find "$LEARNING_DIR" -type f \( -iname "*genai*" -o -iname "*gen*ai*" -o -iname "*ml*" -o -iname "*machine*learning*" \) -iname "*.pdf" -exec cp {} "$TARGET_DIR/GenAI/" \; 2>/dev/null
find "$LEARNING_DIR/Backups & Archives" -type f -iname "Designing_Machine_Learning*" -exec cp {} "$TARGET_DIR/MLOps/" \; 2>/dev/null
echo "✓ Copied GenAI/ML books"

# Copy Kubernetes books
find "$LEARNING_DIR" -type f -iname "*kubernetes*" -iname "*.pdf" -exec cp {} "$TARGET_DIR/Kubernetes/" \; 2>/dev/null
echo "✓ Copied Kubernetes books"

# Count files
echo ""
echo "📊 Summary:"
echo "DevOps:     $(ls -1 "$TARGET_DIR/DevOps" 2>/dev/null | wc -l) books"
echo "Python:     $(ls -1 "$TARGET_DIR/Python" 2>/dev/null | wc -l) books"
echo "GenAI:      $(ls -1 "$TARGET_DIR/GenAI" 2>/dev/null | wc -l) books"
echo "Kubernetes: $(ls -1 "$TARGET_DIR/Kubernetes" 2>/dev/null | wc -l) books"
echo "MLOps:      $(ls -1 "$TARGET_DIR/MLOps" 2>/dev/null | wc -l) books"
echo ""
echo "✅ Done! Books copied to /books/"

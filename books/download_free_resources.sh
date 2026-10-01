#!/bin/bash
# Script to download FREE and LEGAL technical resources

echo "Downloading free technical resources..."

# Mathematics for Machine Learning (Free textbook)
curl -L "https://mml-book.github.io/book/mml-book.pdf" -o "Mathematics_for_ML.pdf" 2>/dev/null && echo "✓ Downloaded: Mathematics for ML"

# Deep Learning Book (Free online version - we'll create a reference)
echo "📚 Deep Learning Book: https://www.deeplearningbook.org/ (Visit to read online)" > "Deep_Learning_Book_Link.txt"

# Google SRE Books (Free)
curl -L "https://sre.google/static/pdf/building_secure_and_reliable_systems.pdf" -o "Google_SRE_Building_Secure_Systems.pdf" 2>/dev/null && echo "✓ Downloaded: Google SRE Book"

# Kubernetes Cheat Sheet
curl -L "https://kubernetes.io/docs/reference/kubectl/cheatsheet/" -o "Kubernetes_Cheatsheet.html" 2>/dev/null && echo "✓ Downloaded: K8s Cheatsheet"

echo ""
echo "✓ Free resources downloaded to /books/"
echo "⚠️  For more books, use the links in RECOMMENDED_RESOURCES.md"

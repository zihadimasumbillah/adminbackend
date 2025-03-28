#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Backend Project Cleanup Script      ${NC}"
echo -e "${BLUE}========================================${NC}"

# Navigate to the backend directory 
cd "$(dirname "$0")"
if [[ ! -f package.json ]]; then
  echo -e "${RED}Error: package.json not found. Please run this script from the backend directory.${NC}"
  exit 1
fi

# Create a backup of package.json
echo -e "${YELLOW}Creating backup of package.json...${NC}"
cp package.json package.json.bak

# Fix problematic import in user.model.ts
echo -e "${YELLOW}Fixing problematic import in user.model.ts...${NC}"
sed -i '' "s/'use client';l, DataTypes, fn, Op } from 'sequelize';/import { Model, DataTypes, fn, Op } from 'sequelize';/" src/models/user.model.ts
sed -i '' "/import React, { useState, useEffect, Suspense } from 'react';/d" src/models/user.model.ts

# Detect package manager
if [[ -f yarn.lock ]]; then
  PKG_MANAGER="yarn"
elif [[ -f pnpm-lock.yaml ]]; then
  PKG_MANAGER="pnpm"
else
  PKG_MANAGER="npm"
fi
echo -e "${GREEN}Detected package manager: ${PKG_MANAGER}${NC}"

# Check for unused dependencies with depcheck
echo -e "${YELLOW}Analyzing dependencies with depcheck...${NC}"

if ! command -v npx &> /dev/null; then
  echo -e "${RED}npx not found. Installing it globally...${NC}"
  npm install -g npx
fi

npx depcheck --ignore-dirs=node_modules,dist > depcheck_results.txt

# Extract unused dependencies
UNUSED_DEPS=$(grep "Unused dependencies" -A 100 depcheck_results.txt | grep -v "Unused dependencies" | grep -v "^\*" | grep -v "^$" | sed 's/^[[:space:]]*//')

if [[ -n "$UNUSED_DEPS" ]]; then
  echo -e "${YELLOW}Unused dependencies found:${NC}"
  echo "$UNUSED_DEPS"
  
  echo -e "${YELLOW}Would you like to remove these unused dependencies? [y/N]${NC}"
  read -r remove_deps
  
  if [[ "$remove_deps" =~ ^[Yy]$ ]]; then
    if [[ "$PKG_MANAGER" == "yarn" ]]; then
      yarn remove $UNUSED_DEPS
    elif [[ "$PKG_MANAGER" == "pnpm" ]]; then
      pnpm remove $UNUSED_DEPS
    else
      npm uninstall $UNUSED_DEPS
    fi
    echo -e "${GREEN}Unused dependencies removed!${NC}"
  fi
else
  echo -e "${GREEN}No unused dependencies found!${NC}"
fi

# Check for unused files
echo -e "${YELLOW}Checking for unused files...${NC}"

# First, let's find references to all TypeScript/JavaScript files
REFERENCED_FILES=$(grep -r --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" "import .* from" src/ | grep -o "'.*'" | tr -d "'" | sort | uniq)

# Add extensions to imports that don't have them
REFERENCED_FILES_WITH_EXT=""
for ref in $REFERENCED_FILES; do
  # Skip node_modules, absolute imports, and relative imports that go outside src
  if [[ $ref == *"node_modules"* || $ref == "/"* || $ref == "@"* ]]; then
    continue
  fi
  
  # For relative imports, we need to check if the file exists
  if [[ $ref == "./"* || $ref == "../"* ]]; then
    # Find the source file that contains the import
    SOURCE_FILE=$(grep -r --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" "import .* from ['\"]$ref['\"]" src/ | cut -d: -f1 | head -n 1)
    
    if [[ -n "$SOURCE_FILE" ]]; then
      # Get the directory of the source file
      SOURCE_DIR=$(dirname "$SOURCE_FILE")
      
      # Resolve the relative path
      RESOLVED_PATH="$SOURCE_DIR/$ref"
      RESOLVED_PATH=$(realpath --relative-to=src "$RESOLVED_PATH")
      
      # Add it to our list if it's in the src directory
      if [[ $RESOLVED_PATH == "src/"* || $RESOLVED_PATH == *"src"* ]]; then
        REFERENCED_FILES_WITH_EXT+="$RESOLVED_PATH "
      fi
    fi
  else
    # For non-relative imports within src
    REFERENCED_FILES_WITH_EXT+="src/$ref "
  fi
done

# Find all TypeScript/JavaScript files
ALL_FILES=$(find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \) | sort)

# Files that might be unreferenced but shouldn't be deleted
IMPORTANT_FILES=(
  "src/server.ts"
  "src/app.ts"
  "src/index.ts"
  "src/main.ts"
  "src/config/database.ts"
  "src/models/associations.ts"
  "src/migrations/"
  "src/scripts/"
)

# Detect potentially unused files
UNUSED_FILES=""
for file in $ALL_FILES; do
  # Skip important files
  SKIP=0
  for important in "${IMPORTANT_FILES[@]}"; do
    if [[ $file == $important* ]]; then
      SKIP=1
      break
    fi
  done
  
  [[ $SKIP -eq 1 ]] && continue
  
  # Check if file is referenced
  if ! echo "$REFERENCED_FILES_WITH_EXT" | grep -q "$file"; then
    # Check for default exports that might be imported under different names
    FILE_BASENAME=$(basename "$file" .ts)
    if ! grep -q "export default $FILE_BASENAME" "$file" || ! grep -r --include="*.ts" --include="*.js" "import .* from .*$FILE_BASENAME" src/ > /dev/null; then
      UNUSED_FILES+="$file "
    fi
  fi
done

if [[ -n "$UNUSED_FILES" ]]; then
  echo -e "${YELLOW}Potentially unused files found:${NC}"
  for file in $UNUSED_FILES; do
    echo "$file"
  done
  
  echo -e "${YELLOW}Would you like to move these files to an 'unused' directory for review? [y/N]${NC}"
  read -r move_files
  
  if [[ "$move_files" =~ ^[Yy]$ ]]; then
    mkdir -p unused
    for file in $UNUSED_FILES; do
      # Create directory structure in unused folder
      mkdir -p "unused/$(dirname "$file")"
      # Copy file to unused folder with path structure preserved
      cp "$file" "unused/$file"
      echo -e "${GREEN}Moved $file to unused/$file${NC}"
    done
    echo -e "${GREEN}Potentially unused files copied to 'unused' directory for review.${NC}"
    echo -e "${YELLOW}Please review these files before deleting them.${NC}"
  fi
else
  echo -e "${GREEN}No unused files found!${NC}"
fi

# Clean up temp files
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
find src -name "*.ts~" -delete
find src -name "*.js~" -delete
find src -name "*.tsx~" -delete
find src -name "*.jsx~" -delete
find src -name "*.bak" -delete
find src -name ".DS_Store" -delete
find src -name "Thumbs.db" -delete

# Clean up log files
find . -name "*.log" -delete
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*

# Clean up duplicate migrations
echo -e "${YELLOW}Checking for duplicate migrations...${NC}"
if [[ -d src/migrations ]]; then
  cd src/migrations
  DUPES=$(find . -name "*.js" -exec basename {} \; | sed 's/-.*\./\./' | sort | uniq -d)
  if [[ -n "$DUPES" ]]; then
    echo -e "${YELLOW}Potential duplicate migrations found:${NC}"
    for dupe in $DUPES; do
      echo $(find . -name "*${dupe}*")
    done
    echo -e "${YELLOW}Please manually review these migrations.${NC}"
  else
    echo -e "${GREEN}No duplicate migrations found.${NC}"
  fi
  cd ../..
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Backend cleanup completed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Remember to test the application after cleanup.${NC}"
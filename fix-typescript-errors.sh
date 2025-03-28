#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing User.create() call in auth.controller.ts...${NC}"

# Create a backup of the file
cp src/controllers/auth.controller.ts src/controllers/auth.controller.ts.bak

# Use awk to find and replace the User.create() call with added properties
awk 'BEGIN{found=0}
/const user = await User.create\({/{
  print $0;
  print "      name: sanitizedName,";
  print "      email: normalizedEmail,";
  print "      password: hashedPassword,";
  print "      status: '\''active'\'',";
  print "      last_activity_time: new Date(),";
  print "      last_login_time: new Date(),";
  print "      created_at: new Date(),";
  print "      login_attempts: 0";
  found=1;
  next;
}
/name: sanitizedName,|email: normalizedEmail,|password: hashedPassword,|status: '\''active'\'',|last_activity_time: new Date()/{
  if(found) next;
}
{print}' src/controllers/auth.controller.ts.bak > src/controllers/auth.controller.ts.tmp

# Replace the original file with the fixed version
mv src/controllers/auth.controller.ts.tmp src/controllers/auth.controller.ts

echo -e "${GREEN}Fixed User.create() call in auth.controller.ts${NC}"

# Test the build
echo -e "${YELLOW}Testing TypeScript compilation...${NC}"
if npx tsc --noEmit; then
  echo -e "${GREEN}Success! All TypeScript errors have been fixed.${NC}"
else
  echo -e "${YELLOW}There are still errors. Let's try a more direct approach...${NC}"
  
  # More direct approach with sed pattern replacement
  sed -i '' 's/const user = await User.create({ \
      name: sanitizedName,\
      email: normalizedEmail,\
      password: hashedPassword,\
      status: '\''active'\'',\
      last_activity_time: new Date()\
    });/const user = await User.create({ \
      name: sanitizedName,\
      email: normalizedEmail,\
      password: hashedPassword,\
      status: '\''active'\'',\
      last_activity_time: new Date(),\
      last_login_time: new Date(),\
      created_at: new Date(),\
      login_attempts: 0\
    });/' src/controllers/auth.controller.ts
    
  echo -e "${GREEN}Applied direct replacement for User.create() call${NC}"
  
  # Test again
  echo -e "${YELLOW}Testing TypeScript compilation again...${NC}"
  if npx tsc --noEmit; then
    echo -e "${GREEN}Success! All TypeScript errors have been fixed.${NC}"
  else
    echo -e "${YELLOW}Let's try the most direct approach - manual replacement...${NC}"
    
    # Create a temporary file with the exact pattern we want to replace
    cat > fix_create.js << 'EOF'
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/controllers/auth.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Define the pattern to locate
const pattern = /const user = await User\.create\(\s*{\s*name:\s*sanitizedName,\s*email:\s*normalizedEmail,\s*password:\s*hashedPassword,\s*status:\s*'active',\s*last_activity_time:\s*new Date\(\)\s*}\);/m;

// Define the replacement with all required properties
const replacement = `const user = await User.create({ 
      name: sanitizedName,
      email: normalizedEmail,
      password: hashedPassword,
      status: 'active',
      last_activity_time: new Date(),
      last_login_time: new Date(),
      created_at: new Date(),
      login_attempts: 0
    });`;

// Replace the pattern with our replacement
const updatedContent = content.replace(pattern, replacement);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent);

console.log('Replaced User.create() call with all required properties');
EOF

    node fix_create.js
    rm fix_create.js
    
    echo -e "${GREEN}Applied manual replacement of User.create() call${NC}"
    
    echo -e "${YELLOW}Testing TypeScript compilation one final time...${NC}"
    if npx tsc --noEmit; then
      echo -e "${GREEN}Success! All TypeScript errors have been fixed.${NC}"
    else
      echo -e "${YELLOW}Manual editing required. Here's exactly what you need to do:${NC}"
      echo ""
      echo "1. Open src/controllers/auth.controller.ts"
      echo "2. Find the User.create() call around line 133"
      echo "3. Replace it with the following code:"
      echo ""
      echo "    const user = await User.create({ "
      echo "      name: sanitizedName,"
      echo "      email: normalizedEmail,"
      echo "      password: hashedPassword,"
      echo "      status: 'active',"
      echo "      last_activity_time: new Date(),"
      echo "      last_login_time: new Date(),"
      echo "      created_at: new Date(),"
      echo "      login_attempts: 0"
      echo "    });"
      echo ""
    fi
  fi
fi
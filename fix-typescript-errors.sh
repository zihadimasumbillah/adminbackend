#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting to fix TypeScript errors in backend code...${NC}"

# Fix auth.controller.ts errors
echo -e "${YELLOW}Fixing auth.controller.ts...${NC}"
sed -i '' 's/if (error.name === '\''SequelizeUniqueConstraintError'\''/if (error && typeof error === '\''object'\'' \&\& '\''name'\'' in error \&\& error.name === '\''SequelizeUniqueConstraintError'\''/g' src/controllers/auth.controller.ts

# Fix User model create call
sed -i '' 's/const user = await User.create({/const user = await User.create({ \
      login_attempts: 0,\
      created_at: new Date(),\
      last_login_time: new Date(),/g' src/controllers/auth.controller.ts

# Fix clientTime error
sed -i '' 's/const clientTime = req.body.clientTime/const clientTime = req.body?.clientTime/g' src/controllers/auth.controller.ts

# Fix user.controller.ts error
echo -e "${YELLOW}Fixing user.controller.ts...${NC}"
sed -i '' 's/const result = await updateUserStatus(req.body.userIds, '\''active'\'', res);/const result = await updateUserStatus(req.body.userIds, '\''active'\'');/g' src/controllers/user.controller.ts

# Fix user.model.ts errors
echo -e "${YELLOW}Fixing user.model.ts...${NC}"

# First add the import for sequelize at top 
sed -i '' 's/import { Model, DataTypes, fn, Op } from '\''sequelize'\'';/import { Model, DataTypes, fn, Op } from '\''sequelize'\'';\
import sequelize from '\''..\/config\/database'\'';/g' src/models/user.model.ts

# Fix id typings in isUnique methods
sed -i '' 's/id: { \[Op.not\]: this.id }/id: { \[Op.not\]: this.id as string }/g' src/models/user.model.ts

# Fix fields array in indexes
sed -i '' 's/\[\[sequelize.fn('\''LOWER'\'', sequelize.col('\''name'\'')), '\''ASC'\''\],/\[{ name: sequelize.fn('\''LOWER'\'', sequelize.col('\''name'\'')), order: '\''ASC'\'' },/g' src/models/user.model.ts
sed -i '' 's/\['\''id'\'', '\''ASC'\''\]/\[{ name: '\''id'\'', order: '\''ASC'\'' }\]/g' src/models/user.model.ts

# Fix scripts/migrate-activity-data.ts
echo -e "${YELLOW}Fixing migrate-activity-data.ts...${NC}"
sed -i '' 's/\[Op.not\]: null/\[Op.not\]: null as unknown as Date/g' src/scripts/migrate-activity-data.ts

# Fix services/activity.service.ts
echo -e "${YELLOW}Fixing activity.service.ts...${NC}"
sed -i '' 's/import { UserActivityHistory, UserActivityHistoryInstance } from '\''\.\.\/models\/user-activity-history\.model'\'';/import { UserActivityHistory } from '\''\.\.\/models\/user-activity-history\.model'\'';/g' src/services/activity.service.ts

echo -e "${GREEN}All TypeScript errors fixed successfully!${NC}"
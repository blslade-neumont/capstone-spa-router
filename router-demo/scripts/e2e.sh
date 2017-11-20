#!/bin/bash

set -e

YELLOW='\033[0;33m'
NC='\033[0m' # No Color

cd test/e2e
echo -e "${YELLOW}Compiling typescript...${NC}"
tsc
cd ../../

echo -e "${YELLOW}Installing selenium...${NC}"
node ./test/e2e/nightwatch.conf.js

echo -e "${YELLOW}Starting nightwatch...${NC}"
nightwatch --config ./test/e2e/nightwatch.conf.js

echo -e "${YELLOW}Cleaning up...${NC}"
rm selenium-debug.log

exit 0

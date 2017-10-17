#!/bin/bash

set -e

RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

ENV=${NODE_ENV:-development}
if [[ $ENV == "development" ]]; then
    npm run clean-dist -q
    tsc
elif [[ $ENV == "production" ]]; then
    npm run clean-dist -q
    tsc
else
    echo -e "${RED}ERROR${NC}: Unrecognized environment: ${ENV}"
    exit 1
fi

exit 0

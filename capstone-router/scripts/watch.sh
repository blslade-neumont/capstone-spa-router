#!/bin/bash

set -e

RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

ENV=${NODE_ENV:-development}
if [[ $ENV != "development" ]]; then
    echo -e "${RED}ERROR${NC}: Cannot run watch script out of the development environment"
    exit 1
fi

npm run clean-dist -q

tsc --watch

exit 0

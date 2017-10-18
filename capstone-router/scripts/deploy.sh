#!/bin/bash

set -e

RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

ENV=${NODE_ENV:-development}
if [[ $ENV != "production" ]]; then
    echo -e "${RED}ERROR${NC}: You can't deploy outside of the production envionment"
    exit 1
fi

yarn
yarn build

exit 0

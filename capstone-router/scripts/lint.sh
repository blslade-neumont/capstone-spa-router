#!/bin/bash

set -e

node_modules/.bin/tslint -c "config/tslint.json" --project "tsconfig.json" -e "**/*.spec.ts" -e "**/src/head/**" -t stylish

exit 0

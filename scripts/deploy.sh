#!/bin/bash

set -e

cd capstone-router
NODE_ENV=production yarn
NODE_ENV=production yarn build
NODE_ENV=production yarn deploy
cd ..

exit 0

#!/bin/bash

set -e

cd router-spike
yarn
yarn travis
cd ..

cd dep-loader-spike
yarn
yarn travis
cd ..

exit 0

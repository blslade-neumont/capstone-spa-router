#!/bin/bash

set -e

cd router-spike && yarn travis && cd ..
cd dep-loader-spike && yarn travis && cd ..

exit 0

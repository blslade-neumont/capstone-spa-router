#!/bin/bash

set -e

npm run test -q
npm run validate-json -q

exit 0

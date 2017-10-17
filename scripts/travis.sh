#!/bin/bash

set -e

# Spikes
cd router-spike && yarn travis && cd ..
cd dep-loader-spike && yarn travis && cd ..

# Packages
cd capstone-router && yarn travis && cd ..

# Examples
cd dependency-loader-visualizer && yarn travis && cd ..

exit 0

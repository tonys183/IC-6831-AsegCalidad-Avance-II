#!/bin/bash
cd "$(dirname "$0")/.."

FILES=$(ls web/e2e-tests/proyecto/*.test.ts 2>/dev/null | awk -F/ '{print "proyecto/"$NF}')

echo -e "Running test cases...\n"
if [ -z "$FILES" ]; then
    echo "No test files found in web/e2e-tests/proyecto/"
    exit 1
fi

HEADLESS=false ./tools/test-js-with-puppeteer $FILES

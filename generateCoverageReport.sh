#!/bin/bash

PATH_TESTS="zerver/tests/proyecto/"
PATH_LIB="zerver/lib/"
PATH_WORKER="zerver/worker/"
PATH_OUT="var/coverage/proyecto/"
FILE_COVERAGE="var/.coverage"
FILES=("$PATH_LIB/camo.py" "$PATH_LIB/emoji_utils.py" "$PATH_LIB/mime_types.py" "$PATH_LIB/name_restrictions.py"
       "$PATH_LIB/utils.py" "$PATH_WORKER/base.py" "$PATH_LIB/exceptions.py" "$PATH_LIB/signals.py"
       "$PATH_TESTS*"
)
FILES_JOINED=$(IFS=,; echo "${FILES[*]}")

echo -e "Generating coverage report...\n"
./tools/test-backend $PATH_TESTS --coverage --no-cov-cleanup
coverage html --data-file=$FILE_COVERAGE --include="$FILES_JOINED" -d $PATH_OUT

echo -e "\nCoverage report saved in ${PATH_OUT}index.html"
explorer.exe $(wslpath -w $PATH_OUT/index.html) 2>/dev/null
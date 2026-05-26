#!/bin/bash

PATH_TESTS="zerver/tests/proyecto/"
PATH_LIB="zerver/lib/"
PATH_WORKER="zerver/worker/"
PATH_OUT="var/coverage/proyecto/"
FILES="$PATH_LIB/camo.py,$PATH_LIB/emoji_utils.py,$PATH_LIB/mime_types.py,$PATH_LIB/name_restrictions.py,$PATH_LIB/utils.py,$PATH_TESTS*"

echo "Generando reporte de cobertura"
coverage html --include="$FILES" -d $PATH_OUT

echo "Reporte guardado en $PATH_OUT/index.html"
explorer.exe $(wslpath -w var/coverage/proyecto/index.html) 2>/dev/null
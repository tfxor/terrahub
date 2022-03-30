#!/bin/sh

## Source path
TERRAHUB_SRC=${@:1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo >&2 '[ERROR] TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f ${TERRAHUB_BUILD_TEMP_VARS} ]; then
  . ${TERRAHUB_BUILD_TEMP_VARS}
fi

## Checking if TERRAHUB_BUILD_OK is true
if [ "${TERRAHUB_BUILD_OK}" != "true" ]; then
  echo '[INFO] Build was NOT executed ==> zip file was NOT created.'
  exit 0
fi

echo "[INFO] Executing -- ${TERRAHUB_SRC} ..."
${TERRAHUB_SRC}
echo '[INFO] Build was executed.'

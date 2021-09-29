#!/bin/sh

## Source path
THUB_SRC=${@:1}
if [ -z "${THUB_SRC}" ]; then
  echo >&2 '[ERROR] THUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if THUB_BUILD_OK is true
if [ "${THUB_BUILD_OK}" != "true" ]; then
  echo '[INFO] Build was NOT executed ==> zip file was NOT created.'
  exit 0
fi

echo "[INFO] Executing -- ${THUB_SRC} ..."
${THUB_SRC}
echo '[INFO] Build was executed.'

#!/bin/bash

## Source path
THUB_SRC=${1}
if [ -z "${THUB_SRC}" ]; then
  echo >&2 'ERROR: THUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Source files or folders for zip process
THUB_ZIP_PATH="${@:2}"
if [ -z "${THUB_ZIP_PATH}" ]; then
  echo >&2 'ERROR: THUB_ZIP_PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if THUB_BUILD_OK is true
if [ "$THUB_BUILD_OK" == "true" ]; then
  zip --version > /dev/null 2>&1 || { echo >&2 'zip is missing. Aborting...'; exit 1; }
  zip -j ${THUB_SRC} ${THUB_ZIP_PATH}
  echo 'Build was executed ==> zip file was created.'
else
  echo 'Build was NOT executed ==> zip file was NOT created.'
fi

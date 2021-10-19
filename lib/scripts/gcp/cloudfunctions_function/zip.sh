#!/bin/bash

## Source path
TERRAHUB_SRC=${1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo >&2 'ERROR: TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Source files or folders for zip process
TERRAHUB_ZIP_PATH="${@:2}"
if [ -z "${TERRAHUB_ZIP_PATH}" ]; then
  echo >&2 'ERROR: TERRAHUB_ZIP_PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if TERRAHUB_BUILD_OK is true
if [ "$TERRAHUB_BUILD_OK" == "true" ]; then
  zip --version > /dev/null 2>&1 || { echo >&2 'zip is missing. Aborting...'; exit 1; }
  zip -j ${TERRAHUB_SRC} ${TERRAHUB_ZIP_PATH}
  echo 'Build was executed ==> zip file was created.'
else
  echo 'Build was NOT executed ==> zip file was NOT created.'
fi

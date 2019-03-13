#!/bin/bash

## Source path
THUB_SRC=${1}
if [ -z "${THUB_SRC}" ]; then
  echo >&2 'ERROR: THUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Google Storage bucket name
THUB_GS_PATH=${2-${THUB_GS_PATH}}
if [ -z "${THUB_GS_PATH}" ]; then
  echo >&2 'ERROR: THUB_GS_PATH variable is empty. Aborting...'
  exit 1
fi

## Clean environmental variables
> .terrahub_build.env

## Checking if THUB_GS_PATH file exists in Google Storage
gsutil --version > /dev/null 2>&1 || { echo >&2 'gsutil is missing. Aborting...'; exit 1; }
THUB_CHECK_TYPE=$(gsutil ls ${THUB_GS_PATH} || echo "")
if [ -z "${THUB_CHECK_TYPE}" ]; then
  echo "INFO: ${THUB_GS_PATH} does NOT exist ==> First execution."
  echo 'export THUB_BUILD_OK="true"' >> .terrahub_build.env
  exit 0
fi

## Downloading from Google Storage
echo 'Downloading THUB_SRC from THUB_GS_PATH'
if [[ $THUB_CHECK_TYPE = *" PRE "* ]]; then
  gsutil rsync ${THUB_GS_PATH} ${THUB_SRC}
else
  gsutil cp ${THUB_GS_PATH} ${THUB_SRC}
fi

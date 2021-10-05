#!/bin/bash

## Source path
TERRAHUB_SRC=${1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo >&2 'ERROR: TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Google Storage bucket name
TERRAHUB_GS_PATH=${2-${TERRAHUB_GS_PATH}}
if [ -z "${TERRAHUB_GS_PATH}" ]; then
  echo >&2 'ERROR: TERRAHUB_GS_PATH variable is empty. Aborting...'
  exit 1
fi

## Clean environmental variables
> .terrahub_build.env

## Checking if TERRAHUB_GS_PATH file exists in Google Storage
gsutil --version > /dev/null 2>&1 || { echo >&2 'gsutil is missing. Aborting...'; exit 1; }
TERRAHUB_CHECK_TYPE=$(gsutil ls ${TERRAHUB_GS_PATH} || echo "")
if [ -z "${TERRAHUB_CHECK_TYPE}" ]; then
  echo "INFO: ${TERRAHUB_GS_PATH} does NOT exist ==> First execution."
  echo 'export TERRAHUB_BUILD_OK="true"' >> .terrahub_build.env
  exit 0
fi

## Downloading from Google Storage
echo 'Downloading TERRAHUB_SRC from TERRAHUB_GS_PATH'
if [[ $TERRAHUB_CHECK_TYPE = *" PRE "* ]]; then
  gsutil rsync ${TERRAHUB_GS_PATH} ${TERRAHUB_SRC}
else
  gsutil cp ${TERRAHUB_GS_PATH} ${TERRAHUB_SRC}
fi

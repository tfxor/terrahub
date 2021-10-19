#!/bin/bash

## Source path
SRC=${1}
if [ -z "${SRC}" ]; then
  echo 'ERROR: SRC variable is empty. Aborting...'
  exit 1
fi

## Google Storage bucket name
GS_PATH=${2-${GS_PATH}}
if [ -z "${GS_PATH}" ]; then
  echo 'ERROR: GS_PATH variable is empty. Aborting...'
  exit 1
fi

## Clean environmental variables
> .terrahub_build.env

## Checking if GS_PATH file exists in Google Storage
gsutil --version > /dev/null 2>&1 || { echo >&2 'gsutil is missing. Aborting...'; exit 1; }
CHECK_TYPE=$(gsutil ls ${GS_PATH}|| echo "")
if [ -z "${CHECK_TYPE}" ]; then
  echo "INFO: ${GS_PATH} does NOT exist ==> First execution."
  echo 'export BUILD_OK="true"' >> .terrahub_build.env
  exit 0
fi

## Downloading from Google Storage
echo 'INFO: Downloading SRC from GS_PATH'
if [[ $CHECK_TYPE = *" PRE "* ]]; then
  gsutil rsync -d -r ${GS_PATH} ${SRC}
else
  gsutil cp ${GS_PATH} ${SRC}
fi

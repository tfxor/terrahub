#!/bin/bash

## Source path
THUB_SRC=${1}
if [ -z "${THUB_SRC}" ]; then
  echo 'ERROR: THUB_SRC variable is empty. Aborting...'
  exit 1
fi

## S3 bucket name
THUB_S3_PATH=${2-${THUB_S3_PATH}}
if [ -z "${THUB_S3_PATH}" ]; then
  echo 'ERROR: THUB_S3_PATH variable is empty. Aborting...'
  exit 1
fi

## Clean environmental variables
> .terrahub_build.env

## Checking if THUB_S3_PATH file exists in S3
gsutil --version > /dev/null 2>&1 || { echo >&2 'gsutil is missing. Aborting...'; exit 1; }
THUB_CHECK_TYPE=$(gsutil ls ${THUB_S3_PATH}|| echo "")
if [ -z "${THUB_CHECK_TYPE}" ]; then
  echo "INFO: ${THUB_S3_PATH} does NOT exist ==> First execution."
  echo 'export THUB_BUILD_OK="true"' >> .terrahub_build.env
  exit 0
fi

## Downloading from S3
echo 'INFO: Downloading THUB_SRC from THUB_S3_PATH'
if [[ $THUB_CHECK_TYPE = *" PRE "* ]]; then
  gsutil rsync -d -r ${THUB_S3_PATH} ${THUB_SRC}
else
  gsutil cp ${THUB_S3_PATH} ${THUB_SRC}
fi

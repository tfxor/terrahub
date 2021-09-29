#!/bin/sh

## Source path
TERRAHUB_SRC=${1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo >&2 '[ERROR] TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## S3 bucket name
TERRAHUB_S3_PATH=${2-${TERRAHUB_S3_PATH}}
if [ -z "${TERRAHUB_S3_PATH}" ]; then
  echo >&2 '[ERROR] TERRAHUB_S3_PATH variable is empty. Aborting...'
  exit 1
fi

## AWS options: --region=[region] --profile=[profile]
TERRAHUB_AWS_OPTIONS="${@:3}"

## Setup environmental variables
if [ -f ${TERRAHUB_BUILD_TEMP_VARS} ]; then
  source ${TERRAHUB_BUILD_TEMP_VARS}
fi

## Checking if TERRAHUB_BUILD_OK is true
if [ "${TERRAHUB_BUILD_OK}" != "true" ]; then
  echo '[INFO] Build was NOT executed ==> Files will NOT be uploaded.'
  exit 0
fi


## Sync TERRAHUB_SRC to TERRAHUB_S3_PATH
aws --version > /dev/null 2>&1 || { echo >&2 'awscli is missing. Aborting...'; exit 1; }
if [[ -d "${TERRAHUB_SRC}" ]]; then
  aws s3 sync ${TERRAHUB_SRC} ${TERRAHUB_S3_PATH} ${TERRAHUB_AWS_OPTIONS}
elif [[ -f "${TERRAHUB_SRC}" ]]; then
  aws s3 cp ${TERRAHUB_SRC} ${TERRAHUB_S3_PATH} ${TERRAHUB_AWS_OPTIONS}
else
  echo >&2 "[ERROR] ${TERRAHUB_SRC} is not valid"
  exit 1
fi

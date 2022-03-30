#!/bin/sh

## Source path
_SRC=${1}
if [ -z "${_SRC}" ]; then
  echo >&2 '[ERROR] _SRC variable is empty. Aborting...'
  exit 1
fi

## S3 bucket name
_S3=${2-${TERRAHUB_BUILD_S3_DEPLOY}}
if [ -z "${_S3}" ]; then
  echo >&2 '[ERROR] _S3 variable is empty. Aborting...'
  exit 1
fi

## AWS options: --region=[region] --profile=[profile]
_OPTIONS="${@:3}"

## Setup environmental variables
if [ -f "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  . ${TERRAHUB_BUILD_TEMP_VARS}
fi

## Checking if TERRAHUB_BUILD_OK is true
if [ "${TERRAHUB_BUILD_OK}" != "true" ]; then
  echo '[INFO] Build was NOT executed ==> Files will NOT be uploaded.'
  exit 0
fi


## Sync _SRC to _S3
aws --version > /dev/null 2>&1 || { echo >&2 'awscli is missing. Aborting...'; exit 1; }
if [ -d "${_SRC}" ]; then
  aws s3 sync ${_SRC} ${_S3} ${_OPTIONS}
elif [ -f "${_SRC}" ]; then
  aws s3 cp ${_SRC} ${_S3} ${_OPTIONS}
else
  echo >&2 "[ERROR] ${_SRC} is not valid"
  exit 1
fi

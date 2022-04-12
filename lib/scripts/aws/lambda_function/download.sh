#!/bin/bash

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

## Clean environmental variables
if [ -f "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  . ${TERRAHUB_BUILD_TEMP_VARS}
fi

## Checking if _S3 file exists in S3
aws --version > /dev/null 2>&1 || { echo >&2 'awscli is missing. Aborting...'; exit 1; }
_COMPARE=$(aws s3 ls ${_S3} ${_OPTIONS} || echo "")
if [ -z "${_COMPARE}" ]; then
  echo "[INFO] ${_S3} does NOT exist ==> First execution."
  echo 'export TERRAHUB_BUILD_OK="true"' >> ${TERRAHUB_BUILD_TEMP_VARS}
  exit 0
fi

## Downloading from S3
echo '[INFO] Downloading _SRC from _S3'
if [[ "${_COMPARE}" == *" PRE "* ]] || [[ "${_S3}" == */ ]]; then
  aws s3 sync ${_S3} ${_SRC} ${_OPTIONS}
else
  aws s3 cp ${_S3} ${_SRC} ${_OPTIONS}
fi

#!/bin/sh

## Source path
THUB_SRC=${1}
if [ -z "${THUB_SRC}" ]; then
  echo '[ERROR]: THUB_SRC variable is empty. Aborting...'
  exit 1
fi

## S3 bucket name
THUB_S3_PATH=${2-${THUB_S3_PATH}}
if [ -z "${THUB_S3_PATH}" ]; then
  echo '[ERROR]: THUB_S3_PATH variable is empty. Aborting...'
  exit 1
fi

## AWS options: --region=[region] --profile=[profile]
THUB_AWS_OPTIONS="${@:3}"

## Clean environmental variables
> .terrahub_build.env

## Checking if THUB_S3_PATH file exists in S3
aws --version > /dev/null 2>&1 || { echo >&2 'awscli is missing. Aborting...'; exit 1; }
THUB_CHECK_TYPE=$(aws s3 ls ${THUB_S3_PATH} ${THUB_AWS_OPTIONS} || echo "")
if [ -z "${THUB_CHECK_TYPE}" ]; then
  echo "[INFO]: ${THUB_S3_PATH} does NOT exist ==> First execution."
  echo 'THUB_BUILD_OK="true"' >> .terrahub_build.env
  exit 0
fi

## Downloading from S3
echo '[INFO]: Downloading THUB_SRC from THUB_S3_PATH'
if echo $THUB_CHECK_TYPE | grep -q " PRE "; then
  aws s3 sync ${THUB_S3_PATH} ${THUB_SRC} ${THUB_AWS_OPTIONS}
else
  aws s3 cp ${THUB_S3_PATH} ${THUB_SRC} ${THUB_AWS_OPTIONS}
fi

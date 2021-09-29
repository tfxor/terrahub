#!/bin/sh

## Source path
TERRAHUB_SRC=${1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo '[ERROR] TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## S3 bucket name
TERRAHUB_S3_PATH=${2-${TERRAHUB_S3_PATH}}
if [ -z "${TERRAHUB_S3_PATH}" ]; then
  echo '[ERROR] TERRAHUB_S3_PATH variable is empty. Aborting...'
  exit 1
fi

## AWS options: --region=[region] --profile=[profile]
TERRAHUB_AWS_OPTIONS="${@:3}"

## Clean environmental variables
> .terrahub_build.env

## Checking if TERRAHUB_S3_PATH file exists in S3
aws --version > /dev/null 2>&1 || { echo >&2 'awscli is missing. Aborting...'; exit 1; }
TERRAHUB_CHECK_TYPE=$(aws s3 ls ${TERRAHUB_S3_PATH} ${TERRAHUB_AWS_OPTIONS} || echo "")
if [ -z "${TERRAHUB_CHECK_TYPE}" ]; then
  echo "[INFO] ${TERRAHUB_S3_PATH} does NOT exist ==> First execution."
  echo 'TERRAHUB_BUILD_OK="true"' >> .terrahub_build.env
  exit 0
fi

## Downloading from S3
echo '[INFO] Downloading TERRAHUB_SRC from TERRAHUB_S3_PATH'
if echo $TERRAHUB_CHECK_TYPE | grep -q " PRE "; then
  aws s3 sync ${TERRAHUB_S3_PATH} ${TERRAHUB_SRC} ${TERRAHUB_AWS_OPTIONS}
else
  aws s3 cp ${TERRAHUB_S3_PATH} ${TERRAHUB_SRC} ${TERRAHUB_AWS_OPTIONS}
fi

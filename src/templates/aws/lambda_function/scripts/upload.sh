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

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if THUB_BUILD_OK is true
if [ "${THUB_BUILD_OK}" == "true" ]; then
  echo '[INFO]: Build was NOT executed ==> Files will NOT be uploaded.'
  exit 0
fi

## Sync THUB_SRC to THUB_S3_PATH
aws --version > /dev/null 2>&1 || { echo >&2 'awscli is missing. Aborting...'; exit 1; }
if [[ -d "${THUB_SRC}" ]]; then
  aws s3 sync ${THUB_SRC} ${THUB_S3_PATH} ${THUB_AWS_OPTIONS}
elif [[ -f "${THUB_SRC}" ]]; then
  aws s3 cp ${THUB_SRC} ${THUB_S3_PATH} ${THUB_AWS_OPTIONS}
else
  echo "[ERROR]: ${THUB_SRC} is not valid"
  exit 1
fi

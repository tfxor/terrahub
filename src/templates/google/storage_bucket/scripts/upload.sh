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

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if THUB_BUILD_OK is true
if [ "${THUB_BUILD_OK}" == "true" ]; then
  ## Sync THUB_SRC to THUB_S3_PATH
  gsutil --version > /dev/null 2>&1 || { echo >&2 'gsutil is missing. Aborting...'; exit 1; }
  if [[ -d "${THUB_SRC}" ]]; then
    gsutil rsync -d -r ${THUB_SRC} ${THUB_S3_PATH}
  elif [[ -f "${THUB_SRC}" ]]; then
    gsutil cp ${THUB_SRC} ${THUB_S3_PATH}
  else
    echo "ERROR: ${THUB_SRC} is not valid"
    exit 1
  fi
else
  echo 'Build was NOT executed ==> Files will NOT be uploaded.'
fi

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

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if BUILD_OK is true
if [ "${BUILD_OK}" == "true" ]; then
  ## Sync SRC to GS_PATH
  gsutil --version > /dev/null 2>&1 || { echo >&2 'gsutil is missing. Aborting...'; exit 1; }
  if [[ -d "${SRC}" ]]; then
    gsutil -m rsync -d -r ${SRC} ${GS_PATH}
  elif [[ -f "${SRC}" ]]; then
    gsutil -m cp ${SRC} ${GS_PATH}
  else
    echo "ERROR: ${SRC} is not valid"
    exit 1
  fi
else
  echo 'Build was NOT executed ==> Files will NOT be uploaded.'
fi

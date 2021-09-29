#!/bin/bash

## Source path
TERRAHUB_SRC=${1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo >&2 'ERROR: TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Google Storage bucket name
TERRAHUB_GS_PATH=${2-${TERRAHUB_GS_PATH}}
if [ -z "${TERRAHUB_GS_PATH}" ]; then
  echo >&2 'ERROR: TERRAHUB_GS_PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if TERRAHUB_BUILD_OK is true
if [ "${TERRAHUB_BUILD_OK}" == "true" ]; then
  ## Sync TERRAHUB_SRC to TERRAHUB_GS_PATH
  gsutil --version > /dev/null 2>&1 || { echo >&2 'gsutil is missing. Aborting...'; exit 1; }
  if [[ -d "${TERRAHUB_SRC}" ]]; then
    gsutil -m rsync ${TERRAHUB_SRC} ${TERRAHUB_GS_PATH}
  elif [[ -f "${TERRAHUB_SRC}" ]]; then
    gsutil -m cp ${TERRAHUB_SRC} ${TERRAHUB_GS_PATH}
  else
    echo >&2 "ERROR: ${TERRAHUB_SRC} is not valid"
    exit 1
  fi
else
  echo 'Build was NOT executed ==> Files will NOT be uploaded.'
fi

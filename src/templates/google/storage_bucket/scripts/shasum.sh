#!/bin/bash

## Source path
THUB_SRC=${1}
if [ -z "${THUB_SRC}" ]; then
  echo 'ERROR: THUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if THUB_BUILD_OK is true
if [ "$THUB_BUILD_OK" == "true" ]; then
  ## Checking if SHA256 sums exists
  if [ -z "${THUB_SHA}" ]; then
    echo "ERROR: THUB_SHA variable is empty. Aborting..."
    exit 1
  fi

  ## Write current SHA256 to THUB_SRC
  echo "${THUB_SHA}" > ${THUB_SRC}
else
  echo "Build was NOT executed ==> SHA256 will NOT be updated."
fi

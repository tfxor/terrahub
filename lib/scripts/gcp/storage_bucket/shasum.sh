#!/bin/bash

## Source path
SRC=${1}
if [ -z "${SRC}" ]; then
  echo 'ERROR: SRC variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if BUILD_OK is true
if [ "$BUILD_OK" == "true" ]; then
  ## Checking if SHA256 sums exists
  if [ -z "${SHA}" ]; then
    echo "ERROR: SHA variable is empty. Aborting..."
    exit 1
  fi

  ## Write current SHA256 to SRC
  echo "${SHA}" > ${SRC}
else
  echo "Build was NOT executed ==> SHA256 will NOT be updated."
fi

#!/bin/bash

## Source path
TERRAHUB_SRC=${1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo >&2 'ERROR: TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if TERRAHUB_BUILD_OK is true
if [ "$TERRAHUB_BUILD_OK" == "true" ]; then
  ## Checking if SHA256 sums exists
  if [ -z "${TERRAHUB_SHA}" ]; then
    echo >&2 'ERROR: TERRAHUB_SHA variable is empty. Aborting...'
    exit 1
  fi

  ## Write current SHA256 to TERRAHUB_SRC
  echo "${TERRAHUB_SHA}" > ${TERRAHUB_SRC}
else
  echo 'Build was NOT executed ==> SHA256 will NOT be updated.'
fi

#!/bin/sh

## Source path
_SRC=${1}
if [ -z "${_SRC}" ]; then
  echo >&2 '[ERROR] _SRC variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  . ${TERRAHUB_BUILD_TEMP_VARS}
fi

## Checking if TERRAHUB_BUILD_OK is true
if [ "$TERRAHUB_BUILD_OK" != "true" ]; then
  echo '[INFO] Build was NOT executed ==> SHA256 will NOT be updated.'
  exit 0
fi

## Checking if SHA256 sums exists
if [ -z "${TERRAHUB_SHA}" ]; then
  echo >&2 '[ERROR] TERRAHUB_SHA variable is empty. Aborting...'
  exit 1
fi

## Write current SHA256 to _SRC
echo "${TERRAHUB_SHA}" > ${_SRC}

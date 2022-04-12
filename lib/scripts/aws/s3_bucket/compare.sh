#!/bin/bash

## Source path
_SRC=${1}
if [ -z "${_SRC}" ]; then
  echo >&2 '[ERROR] _SRC variable is empty. Aborting...'
  exit 1
fi

## Source files for build process
_COMPARE="${@:2}"
if [ -z "${_COMPARE}" ]; then
  echo '[ERROR] _COMPARE variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  . ${TERRAHUB_BUILD_TEMP_VARS}
fi

## Handle case where OS has sha1sum command instead of shasum
if which shasum >/dev/null 2>&1; then
  _SHASUM_CLI="shasum -a 256"
elif which sha256sum >/dev/null 2>&1; then
  _SHASUM_CLI="sha256sum"
else
  echo '[ERROR] Failed to find shasum or sha256sum utility. Aborting...'
  exit 1
fi

## Compare SHA256 sums from _SRC file with files in _COMPARE
echo "[INFO] TERRAHUB_BUILD_OK='${TERRAHUB_BUILD_OK}' ==> Comparing SHA256 sums."
_EXCLUDE=" -path **/node_modules -o -path **/venv "
if [ "$(uname)" == "Darwin" ]; then
  _SHASUM_ID=$(find -s ${_COMPARE} \( ${_EXCLUDE} \) -prune -o -type f -exec ${_SHASUM_CLI} {} \; | sort -k 2 | ${_SHASUM_CLI} | cut -f 1 -d " ")
else
  _SHASUM_ID=$(find ${_COMPARE} \( ${_EXCLUDE} \) -prune -o -type f -exec ${_SHASUM_CLI} {} \; | sort -k 2 | ${_SHASUM_CLI} | cut -f 1 -d " ")
fi

## Checking if needs to skip SHA256 sums compare
echo "export TERRAHUB_SHA=\"${_SHASUM_ID}\"" >> ${TERRAHUB_BUILD_TEMP_VARS}
echo "[INFO] Current SHA256 => ${_SHASUM_ID}"
if [ "${TERRAHUB_BUILD_OK}" == "true" ]; then
  echo "[INFO] TERRAHUB_BUILD_OK='${TERRAHUB_BUILD_OK}' ==> Skipping comparing SHA256 sums."
  exit 0
fi

## Checking if the project requires to be built
_SHASUM_CHK=$(head -n 1 ${_SRC})
echo "[INFO] S3 Object SHA256 => ${_SHASUM_CHK}"
if [ "${_SHASUM_ID}" == "${_SHASUM_CHK}" ]; then
  echo '[INFO] Build is NOT required.'
  exit 0
fi

echo 'export TERRAHUB_BUILD_OK="true"' >> ${TERRAHUB_BUILD_TEMP_VARS}
echo '[INFO] Build is required!'

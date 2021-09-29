#!/bin/sh

## Source path
TERRAHUB_SRC=${1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo >&2 '[ERROR] TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Source files for build process
TERRAHUB_COMPARE_PATH="${@:2}"
if [ -z "${TERRAHUB_COMPARE_PATH}" ]; then
  echo '[ERROR] TERRAHUB_COMPARE_PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f ${TERRAHUB_BUILD_TEMP_VARS} ]; then
  source ${TERRAHUB_BUILD_TEMP_VARS}
fi

## Handle case where OS has sha1sum command instead of shasum
if which shasum >/dev/null 2>&1; then
  SHASUM="shasum -a 256"
elif which sha256sum >/dev/null 2>&1; then
  SHASUM="sha256sum"
else
  echo '[ERROR] Failed to find shasum or sha256sum utility. Aborting...'
  exit 1
fi

## Compare SHA256 sums from TERRAHUB_SRC file with files in TERRAHUB_COMPARE_PATH
echo "[INFO] TERRAHUB_BUILD_OK='${TERRAHUB_BUILD_OK}' ==> Comparing SHA256 sums."
TERRAHUB_EXCLUDE_DIRS=" -path **/node_modules -o -path **/venv "
if [ "$(uname)" == "Darwin" ]; then
  TERRAHUB_SHA=$(find -s ${TERRAHUB_COMPARE_PATH} \( ${TERRAHUB_EXCLUDE_DIRS} \) -prune -o -type f -exec ${SHASUM} {} \; | sort -k 2 | ${SHASUM} | cut -f 1 -d " ")
else
  TERRAHUB_SHA=$(find ${TERRAHUB_COMPARE_PATH} \( ${TERRAHUB_EXCLUDE_DIRS} \) -prune -o -type f -exec ${SHASUM} {} \; | sort -k 2 | ${SHASUM} | cut -f 1 -d " ")
fi

## Checking if needs to skip SHA256 sums compare
echo "export TERRAHUB_SHA=\"${TERRAHUB_SHA}\"" >> ${TERRAHUB_BUILD_TEMP_VARS}
echo "[INFO] Current SHA256 => ${TERRAHUB_SHA}"
if [ "${TERRAHUB_BUILD_OK}" == "true" ]; then
  echo "[INFO] TERRAHUB_BUILD_OK='${TERRAHUB_BUILD_OK}' ==> Skipping comparing SHA256 sums."
  exit 0
fi

## Checking if the project requires to be built
TERRAHUB_COMPARE=$(head -n 1 ${TERRAHUB_SRC})
echo "[INFO] S3 Object SHA256 => ${TERRAHUB_COMPARE}"
if [ "${TERRAHUB_SHA}" == "${TERRAHUB_COMPARE}" ]; then
  echo '[INFO] Build is NOT required.'
  echo 0
fi

echo 'export TERRAHUB_BUILD_OK="true"' >>  ${TERRAHUB_BUILD_TEMP_VARS}
echo '[INFO] Build is required!'

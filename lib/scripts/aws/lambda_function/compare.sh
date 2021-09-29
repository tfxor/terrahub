#!/bin/sh

## Source path
TERRAHUB_SRC=${1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo '[ERROR] TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Source files for build process
TERRAHUB_COMPARE_PATH="${@:2}"
if [ -z "${TERRAHUB_COMPARE_PATH}" ]; then
  echo '[ERROR] TERRAHUB_COMPARE_PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f .terrahub_build.env ]; then
  source ./.terrahub_build.env
fi

## Compare SHA256 sums from TERRAHUB_SRC file with files in TERRAHUB_COMPARE_PATH
echo "[INFO] TERRAHUB_BUILD_OK='${TERRAHUB_BUILD_OK}' ==> Comparing SHA256 sums."
TERRAHUB_EXCLUDE_PATH=" -path **/node_modules -prune  -path **/venv -prune"
if [ "$(uname)" = "Darwin" ]; then
  TERRAHUB_SHA=$(find -s ${TERRAHUB_COMPARE_PATH} \( ${TERRAHUB_EXCLUDE_PATH} \) -o -type f -exec shasum -a 256 {} \; | sort -k 2 | shasum -a 256 | cut -f 1 -d " ")
else
  TERRAHUB_SHA=$(find ${TERRAHUB_COMPARE_PATH} \( ${TERRAHUB_EXCLUDE_PATH} \) -o -type f -exec shasum -a 256 {} \; | sort -k 2 | shasum -a 256 | cut -f 1 -d " ")
fi

## Checking if needs to skip SHA256 sums compare
echo "TERRAHUB_SHA=\"${TERRAHUB_SHA}\"" >> .terrahub_build.env
echo "[INFO] Current SHA256 => ${TERRAHUB_SHA}"
if [ "${TERRAHUB_BUILD_OK}" = "true" ]; then
  echo "[INFO] TERRAHUB_BUILD_OK='${TERRAHUB_BUILD_OK}' ==> Skipping comparing SHA256 sums."
  exit 0
fi

## Checking if the project requires to be built
TERRAHUB_COMPARE=$(head -n 1 ${TERRAHUB_SRC})
echo "[INFO] S3 Object SHA256 => ${TERRAHUB_COMPARE}"
if [ "${TERRAHUB_SHA}" = "${TERRAHUB_COMPARE}" ]; then
  echo '[INFO] Build is NOT required.'
  exit 0
fi

echo '[INFO] Build is required!'
echo 'TERRAHUB_BUILD_OK="true"' >> .terrahub_build.env

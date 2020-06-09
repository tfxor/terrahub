#!/bin/sh

## Source path
THUB_SRC=${1}
if [ -z "${THUB_SRC}" ]; then
  echo '[ERROR]: THUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Source files for build process
THUB_COMPARE_PATH="${@:2}"
if [ -z "${THUB_COMPARE_PATH}" ]; then
  echo '[ERROR]: THUB_COMPARE_PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f .terrahub_build.env ]; then
  source ./.terrahub_build.env
fi

## Compare SHA256 sums from THUB_SRC file with files in THUB_COMPARE_PATH
echo "[INFO]: THUB_BUILD_OK='${THUB_BUILD_OK}' ==> Comparing SHA256 sums."
THUB_EXCLUDE_PATH=" -path **/node_modules -prune  -path **/venv -prune"
if [ "$(uname)" = "Darwin" ]; then
  THUB_SHA=$(find -s ${THUB_COMPARE_PATH} \( ${THUB_EXCLUDE_PATH} \) -o -type f -exec shasum -a 256 {} \; | sort -k 2 | shasum -a 256 | cut -f 1 -d " ")
else
  THUB_SHA=$(find ${THUB_COMPARE_PATH} \( ${THUB_EXCLUDE_PATH} \) -o -type f -exec shasum -a 256 {} \; | sort -k 2 | shasum -a 256 | cut -f 1 -d " ")
fi

## Checking if needs to skip SHA256 sums compare
echo "THUB_SHA=\"${THUB_SHA}\"" >> .terrahub_build.env
echo "[INFO]: Current SHA256 => ${THUB_SHA}"
if [ "${THUB_BUILD_OK}" = "true" ]; then
  echo "[INFO]: THUB_BUILD_OK='${THUB_BUILD_OK}' ==> Skipping comparing SHA256 sums."
  exit 0
fi

## Checking if the project requires to be built
THUB_COMPARE=$(head -n 1 ${THUB_SRC})
echo "[INFO]: S3 Object SHA256 => ${THUB_COMPARE}"
if [ "${THUB_SHA}" = "${THUB_COMPARE}" ]; then
  echo '[INFO]: Build is NOT required.'
  exit 0
fi

echo '[INFO]: Build is required!'
echo 'THUB_BUILD_OK="true"' >> .terrahub_build.env

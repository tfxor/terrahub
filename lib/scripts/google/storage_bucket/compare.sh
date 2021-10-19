#!/bin/bash

## Source path
SRC=${1}
if [ -z "${SRC}" ]; then
  echo 'ERROR: SRC variable is empty. Aborting...'
  exit 1
fi

## Source files for build process
COMPARE_PATH="${@:2}"
if [ -z "${COMPARE_PATH}" ]; then
  echo 'ERROR: COMPARE_PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Compare SHA256 sums from SRC file with files in COMPARE_PATH
echo "BUILD_OK='${BUILD_OK}' ==> Comparing SHA256 sums."
if [ "$(uname)" == "Darwin" ]; then
  SHA=$(find -s ${COMPARE_PATH} -path **/node_modules -prune -o -type f -exec shasum -a 256 {} \; | sort -k 2 | shasum -a 256 | cut -f 1 -d " ")
else
  SHA=$(find ${COMPARE_PATH} -path **/node_modules -prune -o -type f -exec shasum -a 256 {} \; | sort -k 2 | shasum -a 256 | cut -f 1 -d " ")
fi

## Checking if needs to skip SHA256 sums compare
echo "export SHA=\"${SHA}\"" >> .terrahub_build.env
echo "INFO: Current SHA256 => ${SHA}"
if [ "${BUILD_OK}" == "true" ]; then
  echo "INFO: BUILD_OK='${BUILD_OK}' ==> Skipping comparing SHA256 sums."
  exit 0
fi

## Checking if the project requires to be built
COMPARE=$(head -n 1 ${SRC})
echo "INFO: Google Storage Object SHA256 => ${COMPARE}"
if [ "${SHA}" != "${COMPARE}" ]; then
  echo 'Build is required!'
  echo 'export BUILD_OK="true"' >> .terrahub_build.env
else
  echo 'Build is NOT required.'
fi

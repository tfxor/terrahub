#!/bin/sh

## zip option
TERRAHUB_ZIP_OPTION=${1}
if [ "${TERRAHUB_ZIP_OPTION}" != "-r" ] && [ "${TERRAHUB_ZIP_OPTION}" != "-j" ]; then
  echo '[ERROR] TERRAHUB_ZIP_OPTION variable must be "-r" or "-j". Aborting...'
  exit 1
fi

## Source path
TERRAHUB_SRC=${2}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo '[ERROR] TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Source files or folders for zip process
TERRAHUB_ZIP_PATH="${@:3}"
if [ -z "${TERRAHUB_ZIP_PATH}" ]; then
  echo '[ERROR] TERRAHUB_ZIP_PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f .terrahub_build.env ]; then
  source ./.terrahub_build.env
fi

## Checking if TERRAHUB_BUILD_OK is true
if [ ! "${TERRAHUB_BUILD_OK}" = "true" ]; then
  echo '[INFO] Build was NOT executed ==> zip file was NOT created.'
  exit 0
fi

zip --version > /dev/null 2>&1 || { echo >&2 'zip is missing. Aborting...'; exit 1; }
zip ${TERRAHUB_ZIP_OPTION} ${TERRAHUB_SRC} ${TERRAHUB_ZIP_PATH} > /dev/null 2>&1 || { echo >&2 "[ERROR] Failed to archive ${TERRAHUB_ZIP_PATH}"; exit 1; }
echo '[INFO] Build was executed ==> zip file was created.'

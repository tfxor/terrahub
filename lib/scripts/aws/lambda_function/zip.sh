#!/bin/sh

## zip option
_OPTION=${1}
if [ "${_OPTION}" != "-r" ] && [ "${_OPTION}" != "-j" ]; then
  echo >&2 '[ERROR] _OPTION variable must be "-r" or "-j". Aborting...'
  exit 1
fi

## zip file
_FILE=${2}
if [ -z "${_FILE}" ]; then
  echo >&2 '[ERROR] _FILE variable is empty. Aborting...'
  exit 1
fi

## Source files or folders for zip process
_PATH="${@:3}"
if [ -z "${_PATH}" ]; then
  echo >&2 '[ERROR] _PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  . ${TERRAHUB_BUILD_TEMP_VARS}
fi

## Checking if TERRAHUB_BUILD_OK is true
if [ "${TERRAHUB_BUILD_OK}" != "true" ]; then
  echo '[INFO] Build was NOT executed ==> zip file was NOT created.'
  exit 0
fi

## Check if zip file exists and remove it
if [ -f "${_FILE}" ]; then
  echo "[INFO] Removing existing ${_FILE}"
  rm -f "${_FILE}"
fi

zip --version > /dev/null 2>&1 || { echo >&2 'zip is missing. Aborting...'; exit 1; }

_CWD=$(pwd -P)
_ARR=( ${_PATH} )
for i in "${_ARR[@]}"; do
  cd ${i}
  zip ${_OPTION} ${_FILE} .
done
cd ${_CWD}

echo '[INFO] Build was executed ==> zip file was created.'

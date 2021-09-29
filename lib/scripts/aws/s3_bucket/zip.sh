#!/bin/sh

echo 'Zipping ... '
echo $@

## zip option
TERRAHUB_ZIP_OPTION=${1}
if [ "${TERRAHUB_ZIP_OPTION}" != "-r" ] && [ "${TERRAHUB_ZIP_OPTION}" != "-j" ]; then
  echo >&2 '[ERROR] TERRAHUB_ZIP_OPTION variable must be "-r" or "-j". Aborting...'
  exit 1
fi

## zip file
TERRAHUB_ZIP_FILE=${2}
if [ -z "${TERRAHUB_ZIP_FILE}" ]; then
  echo >&2 '[ERROR] TERRAHUB_ZIP_FILE variable is empty. Aborting...'
  exit 1
fi

## Source path
TERRAHUB_SRC=${3}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo >&2 '[ERROR] TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Check if zip file exists and remove it 
ZIP_FILE=$(basename $TERRAHUB_SRC)
if [ -f "${ZIP_FILE}" ]; then
  echo "[INFO] Removing existing ${ZIP_FILE}"
  rm "${ZIP_FILE}"
fi

## Source files or folders for zip process
TERRAHUB_ZIP_PATH="${@:4}"
if [ -z "${TERRAHUB_ZIP_PATH}" ]; then
  echo >&2 '[ERROR] TERRAHUB_ZIP_PATH variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f ${TERRAHUB_BUILD_TEMP_VARS} ]; then
  source ${TERRAHUB_BUILD_TEMP_VARS}
fi

## Checking if TERRAHUB_BUILD_OK is true
if [ "${TERRAHUB_BUILD_OK}" != "true" ]; then
  echo '[INFO] Build was NOT executed ==> zip file was NOT created.'
  exit 0
fi

zip --version > /dev/null 2>&1 || { echo >&2 'zip is missing. Aborting...'; exit 1; }

_CWD=$(pwd -P)
_SRC=$(cd ${_CWD}/${TERRAHUB_SRC}; pwd -P)
_ARR=( ${TERRAHUB_ZIP_PATH} )

for i in "${_ARR[@]}"; do
  cd $(cd ${_CWD}/${i}; pwd -P)
  zip ${TERRAHUB_ZIP_OPTION} ${_SRC}/${TERRAHUB_ZIP_FILE} .
done

cd ${_CWD}

echo '[INFO] Build was executed ==> zip file was created.'

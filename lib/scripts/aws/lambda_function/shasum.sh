#!/bin/sh

## Source path
TERRAHUB_SRC=${1}
if [ -z "${TERRAHUB_SRC}" ]; then
  echo '[ERROR] TERRAHUB_SRC variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
if [ -f .terrahub_build.env ]; then
  source ./.terrahub_build.env
fi

## Checking if TERRAHUB_BUILD_OK is true
if [ ! "$TERRAHUB_BUILD_OK" = "true" ]; then
  echo "[INFO] Build was NOT executed ==> SHA256 will NOT be updated."
  exit 0
fi

## Checking if SHA256 sums exists
if [ -z "${TERRAHUB_SHA}" ]; then
  echo "[ERROR] TERRAHUB_SHA variable is empty. Aborting..."
  exit 1
fi

## Write current SHA256 to TERRAHUB_SRC
echo "${TERRAHUB_SHA}" > ${TERRAHUB_SRC}

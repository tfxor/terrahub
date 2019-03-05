#!/bin/bash

## Component name
COMPONENT_NAME=${1}
if [ -z "${COMPONENT_NAME}" ]; then
  echo >&2 'ERROR: COMPONENT_NAME variable is empty. Aborting...'
  exit 1
fi

## Object name
OBJECT_NAME=${2}
if [ -z "${OBJECT_NAME}" ]; then
  echo >&2 'ERROR: OBJECT_NAME variable is empty. Aborting...'
  exit 1
fi

## Bucket key
THUB_BUCKET_KEY=${3}
if [ -z "${THUB_BUCKET_KEY}" ]; then
  echo >&2 'ERROR: THUB_BUCKET_KEY variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if THUB_BUILD_OK is true
if [ "$THUB_BUILD_OK" == "true" ]; then
  OBJECT_IN_COMPONENT='component.template.resource.google_storage_bucket_object.'${OBJECT_NAME}'.name'
  terrahub configure -i ${COMPONENT_NAME} -c ${OBJECT_IN_COMPONENT}=${THUB_BUCKET_KEY}$(date +%s).zip
  echo 'Build was executed'
else
  echo 'Build was NOT executed'
fi

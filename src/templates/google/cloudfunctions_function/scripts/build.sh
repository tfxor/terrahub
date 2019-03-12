#!/bin/bash

## TerraHub Component
THUB_COMPONENT=${1}
if [ -z "${THUB_COMPONENT}" ]; then
  echo >&2 'ERROR: THUB_COMPONENT variable is empty. Aborting...'
  exit 1
fi

## Google Storage object name
THUB_OBJECT=${2}
if [ -z "${THUB_OBJECT}" ]; then
  echo >&2 'ERROR: THUB_OBJECT variable is empty. Aborting...'
  exit 1
fi

## Google Storage bucket key
THUB_BUCKET_KEY=${3}
if [ -z "${THUB_BUCKET_KEY}" ]; then
  echo >&2 'ERROR: THUB_BUCKET_KEY variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if THUB_BUILD_OK is true
if [ "$THUB_BUILD_OK" == "true" ]; then
  THUB_OBJECT_KEY='component.template.resource.google_storage_bucket_object.'${THUB_OBJECT}'.name'
  terrahub --version > /dev/null 2>&1 || { echo >&2 'terrahub is missing. Aborting...'; exit 1; }
  terrahub configure -i ${THUB_COMPONENT} -c ${THUB_OBJECT_KEY}=${THUB_BUCKET_KEY}$(date +%s).zip
  echo 'Build was executed'
else
  echo 'Build was NOT executed'
fi

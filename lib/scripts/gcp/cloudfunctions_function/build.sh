#!/bin/bash

## TerraHub Component
TERRAHUB_COMPONENT=${1}
if [ -z "${TERRAHUB_COMPONENT}" ]; then
  echo >&2 'ERROR: TERRAHUB_COMPONENT variable is empty. Aborting...'
  exit 1
fi

## Google Storage object name
TERRAHUB_OBJECT=${2}
if [ -z "${TERRAHUB_OBJECT}" ]; then
  echo >&2 'ERROR: TERRAHUB_OBJECT variable is empty. Aborting...'
  exit 1
fi

## Google Storage bucket key
TERRAHUB_BUCKET_KEY=${3}
if [ -z "${TERRAHUB_BUCKET_KEY}" ]; then
  echo >&2 'ERROR: TERRAHUB_BUCKET_KEY variable is empty. Aborting...'
  exit 1
fi

## Setup environmental variables
[ -f .terrahub_build.env ] && . .terrahub_build.env

## Checking if TERRAHUB_BUILD_OK is true
if [ "$TERRAHUB_BUILD_OK" == "true" ]; then
  TERRAHUB_OBJECT_KEY='component.template.resource.google_storage_bucket_object.'${TERRAHUB_OBJECT}'.name'
  terrahub --version > /dev/null 2>&1 || { echo >&2 'terrahub is missing. Aborting...'; exit 1; }
  terrahub configure -i ${TERRAHUB_COMPONENT} -c ${TERRAHUB_OBJECT_KEY}=${TERRAHUB_BUCKET_KEY}$(date +%s).zip
  echo 'Build was executed'
else
  echo 'Build was NOT executed'
fi

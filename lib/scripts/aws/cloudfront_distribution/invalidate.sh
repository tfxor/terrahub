#!/bin/bash

# Validate if terrahub build temporary file exists
if [ -z "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  echo "[ERROR] TERRAHUB_BUILD_TEMP_VARS variable is empty. Aborting..."
  exit 1
fi

# Re-source terrahub build temporary file
if [ -f "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  . ${TERRAHUB_BUILD_TEMP_VARS}
fi

# Source path
if [ -z "${TERRAHUB_VAR_S3_BUCKET_NAME}" ] && [ ! -z "${1}" ]; then
  TERRAHUB_VAR_S3_BUCKET_NAME=${1}
fi

if [ -z "${TERRAHUB_VAR_S3_BUCKET_NAME}" ]; then
  echo "[ERROR] TERRAHUB_VAR_S3_BUCKET_NAME variable is empty. Aborting..."
  exit 1
fi

aws --version > /dev/null 2>&1 || { echo >&2 '[ERROR] awscli is missing. Aborting...'; exit 1; }
_CF=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='${TERRAHUB_VAR_S3_BUCKET_NAME}' || AliasICPRecordals[0].CNAME=='${TERRAHUB_VAR_S3_BUCKET_NAME}'].Id" | jq ".[0]" || "null")

if [ -z "${_CF}" ] || [ "${_CF}" == "null" ]; then
  echo "[ERROR] No CloudFront distributions were found. Aborting..."
  exit 0
fi

_DATETIME=$(date '+%Y%m%d%H%M%S%N%Z')
aws cloudfront create-invalidation --distribution-id ${_CF//\"/} --invalidation-batch '{"CallerReference":"Cache Invalidation '${_DATETIME}'","Paths":{"Quantity":1,"Items":["/*"]}}'

#!/bin/sh

if [[ -z "${TERRAHUB_VAR_S3_BUCKET_NAME}" ]]; then
  echo "[ERROR] TERRAHUB_VAR_S3_BUCKET_NAME variable is empty. Aborting..."
  exit 1
fi

# Initialize terrahub build temporary file
_CWD="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
export TERRAHUB_BUILD_TEMP_VARS="/tmp/.env-$(date '+%Y%m%d%H%M%S%N%Z')"

if [[ -f ${TERRAHUB_BUILD_TEMP_VARS} ]]; then
  rm -f ${TERRAHUB_BUILD_TEMP_VARS}
fi

touch ${TERRAHUB_BUILD_TEMP_VARS}

# Re-source terrahub build temporary file
if [[ -f ${TERRAHUB_BUILD_TEMP_VARS} ]]; then
  source ${TERRAHUB_BUILD_TEMP_VARS}
fi

# Invalidate CloudFront distribution
echo "[EXEC] ${_CWD}/invalidate.sh ${TERRAHUB_VAR_S3_BUCKET_NAME}"
${_CWD}/invalidate.sh ${TERRAHUB_VAR_S3_BUCKET_NAME}

# Cleanup terrahub build temporary file
if [[ -f ${TERRAHUB_BUILD_TEMP_VARS} ]]; then
  rm -f ${TERRAHUB_BUILD_TEMP_VARS}
fi

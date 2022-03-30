#!/bin/sh

if [ -z "${TERRAHUB_VAR_S3_BUCKET_NAME}" ]; then
  echo "[ERROR] TERRAHUB_VAR_S3_BUCKET_NAME variable is empty. Aborting..."
  exit 1
fi

if [ -z "${TERRAHUB_BUILD_COMPILE_FILE}" ]; then
  echo "[ERROR] TERRAHUB_BUILD_COMPILE_FILE variable is empty. Aborting..."
  exit 1
fi

if [ -z "${TERRAHUB_BUILD_LOCAL_PATH}" ]; then
  echo "[ERROR] TERRAHUB_BUILD_LOCAL_PATH variable is empty. Aborting..."
  exit 1
fi

if [ -z "${TERRAHUB_BUILD_SOURCE_PATH}" ]; then
  echo "[ERROR] TERRAHUB_BUILD_SOURCE_PATH variable is empty. Aborting..."
  exit 1
fi

if [ -z "${TERRAHUB_BUILD_S3_DEPLOY}" ]; then
  echo "[ERROR] TERRAHUB_BUILD_S3_DEPLOY variable is empty. Aborting..."
  exit 1
fi

if [ -z "${TERRAHUB_BUILD_S3_PATH}" ]; then
  echo "[ERROR] TERRAHUB_BUILD_S3_PATH variable is empty. Aborting..."
  exit 1
fi

if [ -z "${TERRAHUB_BUILD_INDEX_FILE}" ]; then
  echo "[ERROR] TERRAHUB_BUILD_INDEX_FILE variable is empty. Aborting..."
  exit 1
fi

if [ -z "${TERRAHUB_COMPONENT_HOME}" ]; then
  echo "[ERROR] TERRAHUB_COMPONENT_HOME variable is empty. Aborting..."
  exit 1
fi

if [ -z "${TERRAHUB_BUILD_OK}" ]; then
  export TERRAHUB_BUILD_OK="false"
fi

# Initialize terrahub build temporary file
_CWD="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
export TERRAHUB_BUILD_TEMP_VARS="/tmp/.env-$(date '+%Y%m%d%H%M%S%N%Z')"

if [ -f "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  rm -f ${TERRAHUB_BUILD_TEMP_VARS}
fi

touch ${TERRAHUB_BUILD_TEMP_VARS}

# Download build related files from S3 storage
echo "[EXEC] ${_CWD}/download.sh ${TERRAHUB_COMPONENT_HOME} s3://${TERRAHUB_BUILD_S3_DEPLOY}/${TERRAHUB_BUILD_S3_PATH}/"
${_CWD}/download.sh ${TERRAHUB_COMPONENT_HOME} s3://${TERRAHUB_BUILD_S3_DEPLOY}/${TERRAHUB_BUILD_S3_PATH}/

# Move .env file to path in project root
if [ ! -z "${TERRAHUB_BUILD_DOTENV_FILE}" ] && [ -f "${TERRAHUB_BUILD_DOTENV_FILE}" ]; then
  echo "[EXEC] mv -f ${TERRAHUB_BUILD_DOTENV_FILE} ${TERRAHUB_BUILD_LOCAL_PATH}/"
  mv -f ${TERRAHUB_BUILD_DOTENV_FILE} ${TERRAHUB_BUILD_LOCAL_PATH}/
fi

# Compare index file with source path
echo "[EXEC] ${_CWD}/compare.sh ${TERRAHUB_COMPONENT_HOME}/${TERRAHUB_BUILD_INDEX_FILE} ${TERRAHUB_BUILD_SOURCE_PATH} ${TERRAHUB_BUILD_LOCAL_PATH}/${TERRAHUB_BUILD_DOTENV_FILE}"
${_CWD}/compare.sh ${TERRAHUB_COMPONENT_HOME}/${TERRAHUB_BUILD_INDEX_FILE} ${TERRAHUB_BUILD_SOURCE_PATH} ${TERRAHUB_BUILD_LOCAL_PATH}/${TERRAHUB_BUILD_DOTENV_FILE}

# Compile process
echo "[EXEC] ${TERRAHUB_BUILD_COMPILE_FILE} ${TERRAHUB_BUILD_LOCAL_PATH}"
${TERRAHUB_BUILD_COMPILE_FILE} ${TERRAHUB_BUILD_LOCAL_PATH}

# Check shasum256
echo "[EXEC] ${_CWD}/shasum.sh ${TERRAHUB_COMPONENT_HOME}/${TERRAHUB_BUILD_INDEX_FILE}"
${_CWD}/shasum.sh ${TERRAHUB_COMPONENT_HOME}/${TERRAHUB_BUILD_INDEX_FILE}

# Re-source terrahub build temporary file
if [ -f "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  . ${TERRAHUB_BUILD_TEMP_VARS}
fi

# Upload index file to S3 storage
echo "[EXEC] ${_CWD}/upload.sh ${TERRAHUB_COMPONENT_HOME}/${TERRAHUB_BUILD_INDEX_FILE} s3://${TERRAHUB_BUILD_S3_DEPLOY}/${TERRAHUB_BUILD_S3_PATH}/"
${_CWD}/upload.sh ${TERRAHUB_COMPONENT_HOME}/${TERRAHUB_BUILD_INDEX_FILE} s3://${TERRAHUB_BUILD_S3_DEPLOY}/${TERRAHUB_BUILD_S3_PATH}/

# Upload local build to S3 runtime
if [ -z "${TERRAHUB_VAR_S3_BUCKET_MAX_AGE}" ]; then TERRAHUB_VAR_S3_BUCKET_MAX_AGE="0"; fi
echo "[EXEC] ${_CWD}/upload.sh ${TERRAHUB_BUILD_LOCAL_PATH}/build s3://${TERRAHUB_VAR_S3_BUCKET_NAME}/ --cache-control max-age=${TERRAHUB_VAR_S3_BUCKET_MAX_AGE}"
${_CWD}/upload.sh ${TERRAHUB_BUILD_LOCAL_PATH}/build s3://${TERRAHUB_VAR_S3_BUCKET_NAME}/ --cache-control max-age=${TERRAHUB_VAR_S3_BUCKET_MAX_AGE}

# Cleanup terrahub build temporary file
if [ -f "${TERRAHUB_BUILD_TEMP_VARS}" ]; then
  rm -f ${TERRAHUB_BUILD_TEMP_VARS}
fi

if [ -f "${TERRAHUB_COMPONENT_HOME}/${TERRAHUB_BUILD_INDEX_FILE}" ]; then
  rm -f ${TERRAHUB_COMPONENT_HOME}/${TERRAHUB_BUILD_INDEX_FILE}
fi

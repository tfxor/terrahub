"""
BEFORE RUNNING:
---------------
1. If not already done, enable the Identity and Access Management (IAM) API
   and check the quota for your project at
   https://console.developers.google.com/apis/api/iam
2. This sample uses Application Default Credentials for authentication.
   If not already done, install the gcloud CLI from
   https://cloud.google.com/sdk and run
   `gcloud beta auth application-default login`.
   For more information, see
   https://developers.google.com/identity/protocols/application-default-credentials
3. Install the Python client library for Google APIs by running
   `pip install --upgrade google-api-python-client`
"""
import os
import json
import base64

from pprint import pprint

from googleapiclient import discovery
from oauth2client.client import GoogleCredentials

credentials = GoogleCredentials.get_application_default()

service = discovery.build('iam', 'v1', credentials=credentials)

# The resource name of the service account in the following format:
# `projects/{PROJECT_ID}/serviceAccounts/{ACCOUNT}`.
# Using `-` as a wildcard for the `PROJECT_ID` will infer the project from
# the account. The `ACCOUNT` value can be the `email` address or the
# `unique_id` of the service account.
name = 'projects/' + os.environ['project_id'] + '/serviceAccounts/' + os.environ['service_account_name']  # TODO: Update placeholder value.

create_service_account_key_request_body = {
    "keyAlgorithm": "KEY_ALG_RSA_2048",
    "privateKeyType": "TYPE_GOOGLE_CREDENTIALS_FILE"
}

request = service.projects().serviceAccounts().keys().create(name=name, body=create_service_account_key_request_body)
response_key = request.execute()

file_path=os.environ['file_path']
with open(file_path, 'w+') as outfile:
    print("writing file to: ",file_path)
    # HERE IS WHERE THE MAGIC HAPPENS 
    json.dump(eval(base64.b64decode(response_key['privateKeyData']).decode('utf-8')), outfile)
outfile.close()

pprint('Success create service account key: ' + os.environ['file_path'])

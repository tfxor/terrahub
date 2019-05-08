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

from pprint import pprint
from googleapiclient import discovery
from oauth2client.client import GoogleCredentials

credentials = GoogleCredentials.get_application_default()

service = discovery.build('cloudresourcemanager', 'v1', credentials=credentials)

# REQUIRED: The resource for which the policy is being specified.
# See the operation documentation for the appropriate value for this field.
resource = os.environ['project_id']  # TODO: Update placeholder value.

set_iam_policy_request_body = {
    "policy": {
        "bindings": [
            {
                "members": [
                    "serviceAccount:"+ os.environ['service_account_name']
                ],
                "role": "roles/editor"
            }
        ]
    }
}

request = service.projects().setIamPolicy(resource=resource, body=set_iam_policy_request_body)
response = request.execute()

pprint('Success add role to service account: ' + os.environ['service_account_name'])

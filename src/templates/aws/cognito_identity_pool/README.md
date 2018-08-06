# cognito_identity_pool

Provides a Cognito Identity Pool resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|cognito_identity_pool_name|The name of the user pool.|string|{{ name }}|No|
|cognito_identity_pool_name|Whether the identity pool supports unauthenticated logins or not.|string|false|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|An identity pool ID in the format REGION:GUID.|string|
|thub_id|An identity pool ID in the format REGION:GUID.|string|
|arn|The ARN of the identity pool.|string|

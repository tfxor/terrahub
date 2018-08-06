# api_gateway_api_key

Provides an API Gateway API Key.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|api_gateway_key_name|The name of the API key.|string|{{ name }}|No|
|api_gateway_key_description|The API key description.|string|Managed by TerraHub|No|
|api_gateway_key_enabled|Specifies whether the API key can be used by callers.|boolean|true|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the API key.|string|
|thub_id|The ID of the API key.|string|
|name|The name of the API key.|string|
|created_date|The creation date of the API key.|string|
|last_updated_date|The last update date of the API key.|string|
|value|The value of the API key.|string|

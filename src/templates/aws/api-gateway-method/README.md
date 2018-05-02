# api_gateway_method

Create a HTTP Method for an API Gateway Resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This id of AWS region.|string||Yes|
|api_gateway_method_rest_api_id|The ID of the associated REST API.|int||Yes|
|api_gateway_method_resource_id|The API resource ID.|int||Yes|
|api_gateway_method_http_method|The HTTP Method (GET, POST, PUT, DELETE, HEAD, OPTIONS, ANY)|string|GET|No|
|api_gateway_method_authorization|The type of authorization used for the method (NONE, CUSTOM, AWS_IAM)|string|NONE|No|

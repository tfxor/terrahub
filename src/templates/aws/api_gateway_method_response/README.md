# api_gateway_method_response

Create an HTTP Method Response for an API Gateway Resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|api_gateway_method_rest_api_id|The ID of the associated REST API.|int||Yes|
|api_gateway_method_resource_id|The API resource ID.|int||Yes|
|api_gateway_method_http_method|The HTTP Method (GET, POST, PUT, DELETE, HEAD, OPTIONS, ANY)|string|GET|No|
|api_gateway_method_status_code|The HTTP status code.|string|NONE|No|
|api_gateway_method_response_models|A map of the API models used for the response's content type.|map|{}|No|

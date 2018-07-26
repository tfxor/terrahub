# api-gateway-integration-response

Provides an HTTP Method Integration Response for an API Gateway Resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|aws_api_gateway_rest_api_id|The ID of the associated REST API.|string||Yes|
|aws_api_gateway_resource_id|The API resource ID.|string||Yes|
|aws_api_gateway_method_http_method|The HTTP method (GET, POST, PUT, DELETE, HEAD, OPTION, ANY) when calling the associated resource.|string||Yes|
|aws_api_gateway_status_code|The HTTP status code.|string||Yes|

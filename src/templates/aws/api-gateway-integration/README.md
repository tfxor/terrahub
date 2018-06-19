# api-gateway-integration

Provides an HTTP Method Integration for an API Gateway Integration.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This id of AWS region.|string||Yes|
|aws_api_gateway_rest_api_id|The ID of the associated REST API.|string||Yes|
|aws_api_gateway_resource_id|The API resource ID.|string||Yes|
|aws_api_gateway_method_http_method|The HTTP method (GET, POST, PUT, DELETE, HEAD, OPTION, ANY) when calling the associated resource.|string||Yes|
|api_gateway_integration_type|The integration input's type. Valid values are HTTP (for HTTP backends), MOCK (not calling any real backend), AWS (for AWS services), AWS_PROXY (for Lambda proxy integration) and HTTP_PROXY (for HTTP proxy integration).|string|MOCK|No|

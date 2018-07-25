# api_gateway_gateway_response

Create an API Gateway Gateway Response for a REST API Gateway.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|api_gateway_response_rest_api_id|The string identifier of the associated REST API.|string||Yes|
|api_gateway_response_response_type|The response type of the associated GatewayResponse.|string|UNAUTHORIZED|No|
|api_gateway_response_status_code|The HTTP status code of the Gateway Response.|string|401|No|
|api_gateway_response_parameters|A map specifying the templates used to transform the response body.|map|{}|No|
|api_gateway_response_templates|A map specifying the parameters (paths, query strings and headers) of the Gateway Response.|map|{}|No|

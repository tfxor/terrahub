# api_gateway_resource

Create an API Gateway Resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This id of AWS region.|string||Yes|
|api_gateway_resource_rest_api_id|The ID of the associated REST API.|int||Yes|
|api_gateway_resource_parent_id|The ID of the parent API resource.|int||Yes|
|api_gateway_resource_path_part|The last path segment of this API resource.|string||Yes|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|api_gateway_resource_id|The resource's identifier.|int|
|api_gateway_resource_path|The complete path for this API resource, including all parent paths.|string|

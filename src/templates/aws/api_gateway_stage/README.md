# api_gateway_stage

Provides an API Gateway Stage.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|api_gateway_stage_name|The name of the stage.|string||Yes|
|aws_api_gateway_rest_api_id|The ID of the associated REST API.|string||Yes|
|aws_api_gateway_deployment_id|The ID of the deployment that the stage points to.|string||Yes|
|aws_api_gateway_cache_cluster_enabled|Specifies whether a cache cluster is enabled for the stage.|string||No|
|aws_api_gateway_cache_cluster_size|The size of the cache cluster for the stage, if enabled. Allowed values include 0.5, 1.6, 6.1, 13.5, 28.4, 58.2, 118 and 237.|string|0.5|No|
|aws_api_gateway_client_certificate_id|The description of the stage.|string|null|No|
|aws_api_gateway_description|The description of the stage.|string|Managed by TerraHub|No|
|aws_api_gateway_documentation_version|The version of the associated API documentation.|string|1|No|
|aws_api_gateway_variables|A map that defines the stage variables.|map||No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the stage.|string|
|thub_id|The ID of the stage (hotfix for issue hashicorp/terraform#[7982]).|string|
|invoke_url|The URL to invoke the API pointing to the stage, e.g. https://z4675bid1j.execute-api.eu-west-2.amazonaws.com/prod.|string|
|execution_arn|The execution ARN to be used in lambda_permission's source_arn when allowing API Gateway to invoke a Lambda function, e.g. arn:aws:execute-api:eu-west-2:123456789012:z4675bid1j/prod.|string|

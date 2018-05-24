# api_gateway_deployment

Provides an API Gateway Deployment.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This id of AWS region.|string||Yes|
|api_gateway_rest_api_id|The ID of the associated REST API.|int||Yes|
|api_gateway_deployment_stage_name|The name of the stage.|string||Yes|
|api_gateway_deployment_description|The description of the deployment.|string|Managed by Terrahub|No|
|api_gateway_deployment_stage_description|The description of the stage.|string|Managed by Terrahub|No|
|api_gateway_deployment_variables|A map that defines variables for the stag.|map||No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|api_gateway_deployment_id|The ID of the deployment.|int|
|api_gateway_deployment_stage_name|The name of the stage.|string|
|api_gateway_deployment_invoke_url|The URL to invoke the API pointing to the stage, e.g. https://z4675bid1j.execute-api.eu-west-2.amazonaws.com/prod .|string|
|api_gateway_deployment_execution_arn|The execution ARN to be used in lambda_permission's source_arn when allowing API Gateway to invoke a Lambda function, e.g. arn:aws:execute-api:eu-west-2:123456789012:z4675bid1j/prod .|int|
|api_gateway_deployment_created_date|The creation date of the deployment.|int|

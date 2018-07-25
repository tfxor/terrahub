# aws_lambda_function

Create a Lambda Function resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|lambda_function_name|A unique name for your Lambda Function.|string||Yes|
|lambda_handler|The function entrypoint in your code.|string||Yes|
|lambda_runtime|See Runtimes for valid values.|string|nodejs6.10|No|
|lambda_iam_role|IAM role attached to the Lambda Function.|string||Yes|
|lambda_description|Description of what your Lambda Function does.|string|""|No|
|lambda_memory_size|Amount of memory in MB your Lambda Function can use at runtime.|int|128|No|
|lambda_timeout|The amount of time your Lambda Function has to run in seconds.|int|3|No|
|lambda_reserved_concurrent_executions|The amount of reserved concurrent executions for this lambda function.|int|0|No|
|lambda_publish|Whether to publish creation/change as new Lambda Function Version.|bool|false|No|
|lambda_s3_bucket|The S3 bucket location containing the function's deployment package.|string||Yes|
|lambda_s3_key|The S3 key of an object containing the function's deployment package.|string||Yes|
|lambda_s3_object_version|The object version containing the function's deployment package.|string||Yes|
|lambda_subnet_ids|A list of subnet IDs associated with the Lambda function.|list|[]|No|
|lambda_security_group_ids|A list of security group IDs associated with the Lambda function.|list|[]|No|
|lambda_environment_variables|A map that defines environment variables for the Lambda function.|map|{}|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|lambda_arn|The Amazon Resource Name (ARN) identifying your Lambda Function.|string|
|lambda_qualified_arn|The Amazon Resource Name (ARN) identifying your Lambda Function Version (if versioning is enabled via publish = true).|string|
|lambda_invoke_arn|The ARN to be used for invoking Lambda Function from API Gateway - to be used in aws_api_gateway_integration's uri|string|
|lambda_version|Latest published version of your Lambda Function.|string|
|lambda_last_modified|The date this resource was last modified.|string|

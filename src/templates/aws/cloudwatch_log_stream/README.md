# cloudwatch_log_stream

Provides a CloudWatch Log Stream resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|cloudwatch_log_stream_name|The name of the log stream. Must not be longer than 512 characters and must not contain ':'|string|{{ name }}|No|
|cloudwatch_log_stream_log_group_name|The name of the log group under which the log stream is to be created.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|cloudwatch_log_stream_arn|The Amazon Resource Name (ARN) specifying the log stream.|string|
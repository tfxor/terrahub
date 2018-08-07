# sns_topic

Provides an SNS topic resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|sns_topic_name|The friendly name for the SNS topic.|string|{{ name }}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|arn|The ARN of the SNS topic|string|
|name|The NAME of the SNS topic|string|
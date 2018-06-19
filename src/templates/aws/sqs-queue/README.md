# sqs_queue

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|sqs_queue_name|This is the human-readable name of the queue.|string|{{ name }}|No|
|sqs_queue_kms_master_key_id|The ID of an AWS-managed customer master key (CMK) for Amazon SQS or a custom CMK.|string|alias/aws/sqs|No|
|sqs_queue_kms_data_key_reuse_period_seconds|The length of time, in seconds, for which Amazon SQS can reuse a data key to encrypt or decrypt messages before calling AWS KMS again. An integer representing seconds, between 60 seconds (1 minute) and 86,400 seconds (24 hours).|string|300|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|sqs_queue_id|The URL for the created Amazon SQS queue.|string|
|sqs_queue_arn|The ARN of the SQS queue.|string|
|sqs_queue_name|This is the human-readable name of the queue.|string|

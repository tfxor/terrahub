# cloudwatch_event_permission

Provides a resource to create a CloudWatch Events permission to support cross-account events in the current account default event bus.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|cloudwatch_event_permission_statement_id|An identifier string for the external account that you are granting permissions to.|string|account_access|No|
|cloudwatch_event_permission_action|This is the human-readable name of the queue.|string|events:PutEvents|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The statement ID of the CloudWatch Events permission.|string|
|thub_id|The statement ID of the CloudWatch Events permission.|string|

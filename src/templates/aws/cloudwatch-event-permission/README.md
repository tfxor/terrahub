# cloudwatch_event_permission

Provides a resource to create a CloudWatch Events permission to support cross-account events in the current account default event bus.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|cloudwatch_event_permission_statement_id|An identifier string for the external account that you are granting permissions to.|string|account_access|No|
|cloudwatch_event_permission_action|This is the human-readable name of the queue.|string|events:PutEvents|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|cloudwatch_event_permission_id|The statement ID of the CloudWatch Events permission.|string|

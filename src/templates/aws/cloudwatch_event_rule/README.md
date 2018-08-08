# cloudwatch_event_rule

Provides a CloudWatch Event Rule resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|cloudwatch_event_rule_name|The rule's name.|string|{{ name }}|No|
|cloudwatch_event_rule_event_pattern|Event pattern described a JSON object. See full documentation of CloudWatch Events and Event Patterns for details.(Required, if schedule_expression isn't specified)|json||Yes|
|cloudwatch_event_rule_description|The description of the rule.|string|Managed by TerraHub|No|
|cloudwatch_event_rule_is_enabled|Whether the rule should be enabled.|boolean|true|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|arn|The Amazon Resource Name (ARN) of the rule.|string|

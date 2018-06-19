# cloudwatch_event_target

Provides a CloudWatch Event Target resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|cloudwatch_event_target_rule|The name of the rule you want to add targets to.|string||Yes|
|cloudwatch_event_target_target_id|The unique target assignment ID. If missing, will generate a random, unique id.|string|{{ name }}|No|
|cloudwatch_event_target_arn|The Amazon Resource Name (ARN) associated of the target.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|cloudwatch_event_target_arn|The Amazon Resource Name (ARN) associated of the target.|string|
|cloudwatch_event_target_rule|The name of the rule you want to add targets to.|string|


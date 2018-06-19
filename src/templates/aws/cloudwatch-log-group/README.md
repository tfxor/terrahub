# cloudwatch_log_group

Provides a CloudWatch Log Group resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|cloudwatch_log_group_name|The name of the log group.|string|{{ name }}|No|
|cloudwatch_log_group_tag_name|A name tag to assign to the resource.|string|{{ name }}|No|
|cloudwatch_log_group_tag_description|A description tag to assign to the resource.|string|Managed by TerraHub|No|
|cloudwatch_log_group_tag_environment|A environment tag to assign to the resource.|string|default|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|cloudwatch_log_group_arn|The Amazon Resource Name (ARN) specifying the log group.|string|


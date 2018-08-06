# aws_lb_listener_rule

Provides a Load Balancer Listener Rule resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|lb_listener_rule_listener_arn|The ARN of the listener to which to attach the rule.|string||Yes|
|lb_listener_rule_priority|The priority for the rule between 1 and 50000. Leaving it unset will automatically set the rule with next available priority after currently existing highest rule. A listener can't have multiple rules with the same priority.|number|100|No|
|lb_listener_rule_action_type|The type of routing action. The only valid value is forward.|string|forward|No|
|lb_listener_rule_action_target_group_arn|The ARN of the Target Group to which to route traffic.|string||Yes|
|lb_listener_rule_condition_field| The name of the field. Must be one of path-pattern for path based routing or host-header for host based routing.|string|host-header|No|
|lb_listener_rule_condition_values|The path patterns to match. A maximum of 1 can be defined.|list||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ARN of the rule (matches arn)|string|
|thub_id|The ARN of the rule (matches arn)|string|
|arn|The ARN of the rule (matches id)|string|

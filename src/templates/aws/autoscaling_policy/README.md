# aws_autoscaling_policy

Provides an AutoScaling Scaling Policy resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|autoscaling_policy_name|The name of the policy.|string|{{ name }}|No|
|autoscaling_policy_autoscaling_group_name|The name of the autoscaling group.|string||Yes|
|autoscaling_policy_adjustment_type|Specifies whether the adjustment is an absolute number or a percentage of the current capacity. Valid values are ChangeInCapacity, ExactCapacity, and PercentChangeInCapacity.|string|ChangeInCapacity|No|
|autoscaling_policy_policy_type|The policy type, either "SimpleScaling", "StepScaling" or "TargetTrackingScaling". If this value isn't provided, AWS will default to "SimpleScaling."|string|SimpleScaling|No|
|autoscaling_policy_cooldown| The amount of time, in seconds, after a scaling activity completes and before the next scaling activity can start.|number|300|No|
|autoscaling_policy_scaling_adjustment|The number of instances by which to scale. adjustment_type determines the interpretation of this number (e.g., as an absolute number or as a percentage of the existing Auto Scaling group size). A positive increment adds to the current capacity and a negative value removes from the current capacity.|number|4|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|arn|The ARN assigned by AWS to the scaling policy.|string|
|name|The scaling policy's name.|string|
|autoscaling_group_name|The scaling policy's assigned autoscaling group.|string|
|adjustment_type|The scaling policy's adjustment type.|string|
|policy_type|The scaling policy's type.|string|

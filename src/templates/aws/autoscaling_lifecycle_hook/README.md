# aws_autoscaling_lifecycle_hook

Provides an AutoScaling Lifecycle Hook resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|autoscaling_lifecycle_hook_name|The name of the lifecycle hook.|string||Yes|
|autoscaling_lifecycle_hook_asg_name|The name of the Auto Scaling group to which you want to assign the lifecycle hook.|string||Yes|
|autoscaling_lifecycle_hook_default_result|Defines the action the Auto Scaling group should take when the lifecycle hook timeout elapses or if an unexpected failure occurs. The value for this parameter can be either CONTINUE or ABANDON. The default value for this parameter is ABANDON.|string|CONTINUE|No|
|autoscaling_lifecycle_hook_heartbeat_timeout|Defines the amount of time, in seconds, that can elapse before the lifecycle hook times out.|number|2000|No|
|autoscaling_lifecycle_hook_lifecycle_transition|The instance state to which you want to attach the lifecycle hook. For a list of lifecycle hook types, see describe-lifecycle-hook-types|string|autoscaling:EC2_INSTANCE_LAUNCHING|No|
|autoscaling_lifecycle_hook_notification_target_name|The Name of the notification target that Auto Scaling will use to notify you when an instance is in the transition state for the lifecycle hook.|string||Yes|
|autoscaling_lifecycle_hook_role_name|The Name of the IAM role that allows the Auto Scaling group to publish to the specified notification target.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|

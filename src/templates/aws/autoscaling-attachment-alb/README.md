# aws_autoscaling_attachment

Provides an AutoScaling Attachment resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|autoscaling_attachment_autoscaling_group_name|Name of ASG to associate with the ELB.|string||Yes|
|autoscaling_attachment_alb_target_group_arn|The ARN of an ALB Target Group.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|

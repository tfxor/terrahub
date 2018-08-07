# aws_lb_target_group_attachment

Provides the ability to register instances and containers with a LB target group.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|lb_target_group_attachment_target_group_arn|The ARN of the target group with which to register targets.|string||Yes|
|lb_target_group_attachment_target_id|The ID of the target. This is the Instance ID for an instance, or the container ID for an ECS container. If the target type is ip, specify an IP address.|string||Yes|
|lb_target_group_attachment_port|The port on which targets receive traffic.|number|80|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|A unique identifier for the attachment|string|
|thub_id|A unique identifier for the attachment (hotfix for issue hashicorp/terraform#[7982]).|string|

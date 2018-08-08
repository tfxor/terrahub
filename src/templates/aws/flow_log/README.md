# aws_flow_log

Provides a VPC/Subnet/ENI Flow Log to capture IP traffic for a specific network interface, subnet, or VPC. Logs are sent to a CloudWatch Log Group.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|flow_log_log_group_name|The name of the CloudWatch log group.|string||Yes|
|flow_log_iam_role_arn|The ARN for the IAM role that's used to post flow logs to a CloudWatch Logs log group.|string||Yes|
|flow_log_vpc_id|VPC ID to attach to.|string||Yes|
|flow_log_subnet_id|Subnet ID to attach to.|string||Yes|
|flow_log_eni_id|Elastic Network Interface ID to attach to.|string||Yes|
|flow_log_traffic_type|The type of traffic to capture. Valid values: ACCEPT,REJECT, ALL|string|ALL|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The Flow Log ID.|string|
|thub_id|The Flow Log ID (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|

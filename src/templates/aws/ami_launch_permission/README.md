# aws_ami_launch_permission

Adds launch permission to Amazon Machine Image (AMI) from another AWS account.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|ami_launch_permission_image_id|A region-unique name for the AMI.|string||Yes|
|ami_launch_permission_account_id|An AWS Account ID to add launch permissions.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|A combination of "image_id-account_id".|string|
|thub_id|A combination of "image_id-account_id" (hotfix for issue hashicorp/terraform#[7982]).|string|
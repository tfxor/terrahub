# aws_snapshot_create_volume_permission

Adds permission to create volumes off of a given EBS Snapshot.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|snapshot_create_volume_permission_snapshot_id|A snapshot ID.|string||Yes|
|snapshot_create_volume_permission_account_id|An AWS Account ID to add create volume permissions.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|A combination of "snapshot_id-account_id".|string|
|thub_id|A combination of "snapshot_id-account_id" (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|

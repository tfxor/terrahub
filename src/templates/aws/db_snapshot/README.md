# aws_db_snapshot

Creates a Snapshot of an DB Instance.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|db_snapshot_identifier|The Identifier for the snapshot.|string|{{ name }}|No|
|db_snapshot_instance_identifier|The DB Instance Identifier from which to take the snapshot.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|

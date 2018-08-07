# aws_ebs_snapshot

Creates a Snapshot of an EBS Volume.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|ebs_snapshot_volume_id|The Volume ID of which to make a snapshot.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The snapshot ID (e.g. snap-59fcb34e).|string|
|thub_id|The snapshot ID (e.g. snap-59fcb34e) (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|
|owner_id|The AWS account ID of the EBS snapshot owner.|string|
|owner_alias|Value from an Amazon-maintained list (amazon, aws-marketplace, microsoft) of snapshot owners.|string|
|encrypted|Whether the snapshot is encrypted.|string|
|volume_size|The size of the drive in GiBs.|string|
|kms_key_id|The ARN for the KMS encryption key.|string|
|data_encryption_key_id|The data encryption key identifier for the snapshot.|string|
|tags|A mapping of tags for the snapshot.|string|

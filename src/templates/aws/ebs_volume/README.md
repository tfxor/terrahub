# aws_ebs_volume

Manages a single EBS volume.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|ebs_volume_availability_zone|The AZ where the EBS volume will exist.|string|us-east-1a|No|
|ebs_volume_size|The size of the drive in GiBs.|number|8|No|
|ebs_volume_encrypted|If true, the disk will be encrypted.|boolean|false|No|
|ebs_volume_type|The type of EBS volume. Can be "standard", "gp2", "io1", "sc1" or "st1" (Default: "standard").|string|standard|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The volume ID (e.g. vol-59fcb34e).|string|
|thub_id|The volume ID (e.g. vol-59fcb34e) (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|
|arn|The volume ARN (e.g. arn:aws:ec2:us-east-1:0123456789012:volume/vol-59fcb34e).|string|

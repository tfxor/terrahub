# aws_ami

The AMI resource allows the creation and management of a completely-custom Amazon Machine Image (AMI).
If you just want to duplicate an existing AMI, possibly copying it to another region, it's better to use aws_ami_copy instead.
If you just want to share an existing AMI with another AWS account, it's better to use aws_ami_launch_permission instead.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|ami_name|A region-unique name for the AMI.|string|{{name}}|No|
|ami_description|A longer, human-readable description for the AMI.|string|Managed by TerraHub|No|
|ami_root_device_name|The name of the root device.|string|/dev/xvda|No|
|ami_virtualization_type|Keyword to choose what virtualization mode created instances will use.|string|hvm|No|
|ami_architecture|Machine architecture for created instances.|string|x86_64|No|
|ami_device_name|The path at which the device is exposed to created instances.|string|/dev/xvda|No|
|ami_delete_on_termination|Boolean controlling whether the EBS volumes created to support each created instance will be deleted once that instance is terminated.|boolean|true|No|
|ami_encrypted|Boolean controlling whether the created EBS volumes will be encrypted.|boolean|false|No|
|ami_volume_size|The size of created volumes in GiB. If snapshot_id is set and volume_size is omitted then the volume will have the same size as the selected snapshot.|number|8|No|
|ami_volume_type|The type of EBS volume to create. Can be one of "standard" (the default), "io1" or "gp2".|string|standard|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the created AMI.|string|
|thub_id|The ID of the created AMI (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|
|root_snapshot_id|The Snapshot ID for the root volume (for EBS-backed AMIs).|string|

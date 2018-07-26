# aws_volume_attachment

Provides an AWS EBS Volume Attachment as a top level resource, to attach and detach volumes from AWS Instances.

NOTE on EBS block devices: If you use ebs_block_device on an aws_instance, Terraform will assume management over the full set of non-root EBS block devices for the instance, and treats additional block devices as drift. For this reason, ebs_block_device cannot be mixed with external aws_ebs_volume + aws_ebs_volume_attachment resources for a given instance.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|volume_attachment_device_name|The device name to expose to the instance (for example, /dev/sdh or xvdh)|string|/dev/sdb|No|
|volume_attachment_volume_id|ID of the Instance to attach to.|string||Yes|
|volume_attachment_instance_id|ID of the Volume to be attached.|string||Yes|
|volume_attachment_force_detach|Set to true if you want to force the volume to detach. Useful if previous attempts failed, but use this option only as a last resort, as this can result in data loss. See Detaching an Amazon EBS Volume from an Instance for more information.|boolean|false|No|
|volume_attachment_skip_destroy|Set this to true if you do not wish to detach the volume from the instance to which it is attached at destroy time, and instead just remove the attachment from Terraform state. This is useful when destroying an instance which has volumes created by some other means attached.|boolean|false|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|device_name|The device name exposed to the instance|string|
|instance_id|ID of the Instance|string|
|volume_id|ID of the Volume|string|

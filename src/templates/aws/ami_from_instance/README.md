# aws_ami_from_instance

The "AMI from instance" resource allows the creation of an Amazon Machine Image (AMI) modelled after an existing EBS-backed EC2 instance.
The created AMI will refer to implicitly-created snapshots of the instance's EBS volumes and mimick its assigned block device configuration at the time the resource is created.
This resource is best applied to an instance that is stopped when this instance is created, so that the contents of the created image are predictable. When applied to an instance that is running, the instance will be stopped before taking the snapshots and then started back up again, resulting in a period of downtime.
Note that the source instance is inspected only at the initial creation of this resource. Ongoing updates to the referenced instance will not be propagated into the generated AMI. Users may taint or otherwise recreate the resource in order to produce a fresh snapshot.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|ami_from_instance_name|A region-unique name for the AMI.|string|{{name}}|No|
|ami_from_instance_source_instance_id|The id of the instance to use as the basis of the AMI.|string||Yes|
|ami_from_instance_snapshot_without_reboot|Boolean that overrides the behavior of stopping the instance before snapshotting. This is risky since it may cause a snapshot of an inconsistent filesystem state, but can be used to avoid downtime if the user otherwise guarantees that no filesystem writes will be underway at the time of snapshot.|boolean|true|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the created AMI.|string|
|thub_id|The ID of the created AMI.|string|

# aws_ami_copy

The "AMI copy" resource allows duplication of an Amazon Machine Image (AMI), including cross-region copies.
If the source AMI has associated EBS snapshots, those will also be duplicated along with the AMI.
This is useful for taking a single AMI provisioned in one region and making it available in another for a multi-region deployment.
Copying an AMI can take several minutes. The creation of this resource will block until the new AMI is available for use on new instances.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|ami_copy_name|A region-unique name for the AMI.|string|{{ name }}|No|
|ami_copy_description|A description for the AMI.|string|Managed by TerraHub|No|
|ami_copy_source_ami_id|The id of the AMI to copy. This id must be valid in the region given by source_ami_region.|string||Yes|
|ami_copy_encrypted|Specifies whether the destination snapshots of the copied image should be encrypted. |boolean|false|No|
|ami_copy_source_ami_region|The region from which the AMI will be copied. This may be the same as the AWS provider region in order to create a copy within the same region.|string|us-east-1|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the created AMI.|string|
|thub_id|The ID of the created AMI.|string|

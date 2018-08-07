# aws_default_security_group

Provides a resource to manage the default AWS Security Group.

For EC2 Classic accounts, each region comes with a Default Security Group. Additionally, each VPC created in AWS comes with a Default Security Group that can be managed, but not destroyed. This is an advanced resource, and has special caveats to be aware of when using it. Please read this document in its entirety before using this resource.

The aws_default_security_group behaves differently from normal resources, in that Terraform does not create this resource, but instead "adopts" it into management. We can do this because these default security groups cannot be destroyed, and are created with a known set of default ingress/egress rules.

When Terraform first adopts the Default Security Group, it immediately removes all ingress and egress rules in the Security Group. It then proceeds to create any rules specified in the configuration. This step is required so that only the rules specified in the configuration are created.

This resource treats its inline rules as absolute; only the rules defined inline are created, and any additions/removals external to this resource will result in diff shown. For these reasons, this resource is incompatible with the aws_security_group_rule resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|security_group_vpc_id|The VPC ID.|string||Yes|
|security_group_ingress_protocol|The protocol.|number|-1|No|
|security_group_ingress_self|If true, the security group itself will be added as a source to this ingress rule.|boolen|true|No|
|security_group_ingress_from_port|The start port.|number|0|No|
|security_group_ingress_to_port|The end range port.|number|0|No|
|security_group_egress_from_port|The start port.|number|0|No|
|security_group_egress_to_port|The end range port.|number|0|No|
|security_group_egress_protocol|The protocol.|number|-1|No|
|security_group_egress_cidr_blocks|List of CIDR blocks.|number|0.0.0.0/0|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the security group.|string|
|thub_id|The ID of the security group (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|
|arn|The ARN of the security group.|string|
|vpc_id|The VPC ID.|string|
|owner_id|The owner ID.|string|
|name|The name of the security group.|string|
|description|The description of the security group.|string|
|ingress|The ingress rules. See above for more.|string|
|egress|The egress rules. See above for more.|string|

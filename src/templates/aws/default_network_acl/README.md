# aws_default_network_acl

Provides a resource to manage the default AWS Network ACL. VPC Only.

Each VPC created in AWS comes with a Default Network ACL that can be managed, but not destroyed. This is an advanced resource, and has special caveats to be aware of when using it. Please read this document in its entirety before using this resource.

The aws_default_network_acl behaves differently from normal resources, in that Terraform does not create this resource, but instead attempts to "adopt" it into management. We can do this because each VPC created has a Default Network ACL that cannot be destroyed, and is created with a known set of default rules.

When Terraform first adopts the Default Network ACL, it immediately removes all rules in the ACL. It then proceeds to create any rules specified in the configuration. This step is required so that only the rules specified in the configuration are created.

This resource treats its inline rules as absolute; only the rules defined inline are created, and any additions/removals external to this resource will result in diffs being shown. For these reasons, this resource is incompatible with the aws_network_acl_rule resource.

For more information about Network ACLs, see the AWS Documentation on Network ACLs.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|default_network_acl_id|The Network ACL ID to manage. This attribute is exported from aws_vpc, or manually found via the AWS Console.|string||Yes|
|default_network_acl_subnet_ids|A list of Subnet IDs to apply the ACL to. See the notes below on managing Subnets in the Default Network ACL.|list||Yes|
|default_network_acl_ingress_protocol|The protocol to match. If using the -1 'all' protocol, you must specify a from and to port of 0.|number|-1|No|
|default_network_acl_ingress_rule_no|The rule number. Used for ordering.|number|100|No|
|default_network_acl_ingress_action|The action to take.|string|allow|No|
|default_network_acl_ingress_cidr_block|The CIDR block to match. This must be a valid network mask.|string|0.0.0.0/0|No|
|default_network_acl_ingress_from_port|The from port to match.|number|0|No|
|default_network_acl_ingress_to_port|The to port to match.|number|0|No|
|default_network_acl_ingress_icmp_type|The ICMP type to be used.|number|0|No|
|default_network_acl_ingress_icmp_code|The ICMP type code to be used.|number|0|No|
|default_network_acl_egress_protocol|The protocol to match. If using the -1 'all' protocol, you must specify a from and to port of 0.|number|-1|No|
|default_network_acl_egress_rule_no|The rule number. Used for ordering.|number|100|No|
|default_network_acl_egress_action|The action to take.|string|allow|No|
|default_network_acl_egress_cidr_block|The CIDR block to match. This must be a valid network mask.|string|0.0.0.0/0|No|
|default_network_acl_egress_from_port|The from port to match.|number|0|No|
|default_network_acl_egress_to_port|The to port to match.|number|0|No|
|default_network_acl_egress_icmp_type|The ICMP type to be used.|number|0|No|
|default_network_acl_egress_icmp_code|The ICMP type code to be used.|number|0|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the Default Network ACL.|string|
|thub_id|The ID of the Default Network ACL (hotfix for issue hashicorp/terraform#[7982]).|string|
|vpc_id|The ID of the associated VPC|string|
|ingress|Set of ingress rules|list|
|egress|Set of egress rules|list|
|subnet_ids|IDs of associated Subnets|list|
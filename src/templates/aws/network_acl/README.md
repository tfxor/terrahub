# aws_network_acl

Provides an network ACL resource. You might set up network ACLs with rules similar to your security groups in order to add an additional layer of security to your VPC.

NOTE on Network ACLs and Network ACL Rules: Terraform currently provides both a standalone Network ACL Rule resource and a Network ACL resource with rules defined in-line. At this time you cannot use a Network ACL with in-line rules in conjunction with any Network ACL Rule resources. Doing so will cause a conflict of rule settings and will overwrite rules.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|network_acl_vpc_id|The ID of the associated VPC.|string||Yes|
|network_acl_subnet_ids|A list of Subnet IDs to apply the ACL to.|list||Yes|
|network_acl_egress_protocol|The protocol to match. If using the -1 all protocol, you must specify a from and to port of 0.|string|tcp|No|
|network_acl_egress_rule_no|The rule number. Used for ordering.|number|200|No|
|network_acl_egress_action|The action to take.|string|allow|No|
|network_acl_egress_cidr_block|The CIDR block to match. This must be a valid network mask.|string|10.3.0.0/18|No|
|network_acl_egress_from_port|The from port to match.|number|443|No|
|network_acl_egress_to_port|The to port to match.|number|443|No|
|network_acl_egress_icmp_type|The ICMP type to be used.|number|0|No|
|network_acl_egress_icmp_code|The ICMP type code to be used.|number|0|No|
|network_acl_ingress_protocol|The protocol to match. If using the -1 all protocol, you must specify a from and to port of 0.|string|tcp|No|
|network_acl_ingress_rule_no|The rule number. Used for ordering.|number|100|No|
|network_acl_ingress_action|The action to take.|string|allow|No|
|network_acl_ingress_cidr_block|The CIDR block to match. This must be a valid network mask.|string|10.3.0.0/18|No|
|network_acl_ingress_from_port|The from port to match.|number|80|No|
|network_acl_ingress_to_port|The to port to match.|number|80|No|
|network_acl_ingress_icmp_type|The ICMP type to be used.|number|0|No|
|network_acl_ingress_icmp_code|The ICMP type code to be used.|number|0|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the network ACL.|string|
|thub_id|The ID of the network ACL (hotfix for issue hashicorp/terraform#[7982]).|string|
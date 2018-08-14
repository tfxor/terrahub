# aws_security_group_rule

Provides a security group rule resource. Represents a single ingress or egress group rule, which can be added to external Security Groups.

NOTE on Security Groups and Security Group Rules: Terraform currently provides both a standalone Security Group Rule resource (a single ingress or egress rule), and a Security Group resource with ingress and egress rules defined in-line. At this time you cannot use a Security Group with in-line rules in conjunction with any Security Group Rule resources. Doing so will cause a conflict of rule settings and will overwrite rules.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|security_group_rule_description|Description of the rule.|string|Managed by TerraHub|No|
|security_group_rule_type|The type of rule being created. Valid options are ingress (inbound) or egress (outbound).|string|ingress|No|
|security_group_rule_from_port|The start port (or ICMP type number if protocol is icmp).|number|0|No|
|security_group_rule_to_port|The end port (or ICMP code if protocol is icmp).|number|65535|No|
|security_group_rule_protocol|The protocol. If not icmp, tcp, udp, or all use the protocol number.|string||No|
|security_group_rule_type|List of CIDR blocks. Cannot be specified with source_security_group_id.|list|["0.0.0.0/0"]|No|
|security_group_rule_security_group_id|The security group to apply this rule to.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the security group rule.|string|
|thub_id|The ID of the security group rule (hotfix for issue hashicorp/terraform#[7982]).|string|
|type|The type of rule, ingress or egress.|string|
|from_port|The start port (or ICMP type number if protocol is icmp).|string|
|to_port|The end port (or ICMP code if protocol is icmp).|string|
|protocol|The protocol used.|string|
|description|Description of the rule.|string|
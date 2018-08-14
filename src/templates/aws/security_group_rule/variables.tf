# Define list of variables to be used in main.tf

############
# provider #
############
variable "account_id" {
  description = "Allowed AWS account ID, to prevent you from mistakenly using an incorrect one (and potentially end up destroying a live environment)."
}

variable "region" {
  description = "This is the AWS region."
}

#############
# top level #
#############
variable "security_group_rule_description" {
  description = "Description of the rule."
}

variable "security_group_rule_type" {
  description = "The type of rule being created. Valid options are ingress (inbound) or egress (outbound)."
}

variable "security_group_rule_from_port" {
  description = "The start port (or ICMP type number if protocol is icmp)."
}

variable "security_group_rule_to_port" {
  description = "The end port (or ICMP code if protocol is icmp)."
}

variable "security_group_rule_protocol" {
  description = "The protocol. If not icmp, tcp, udp, or all use the protocol number."
}

variable "security_group_rule_cidr_blocks" {
  type        = "list"
  description = "List of CIDR blocks. Cannot be specified with source_security_group_id."
}

variable "security_group_rule_security_group_id" {
  description = "The security group to apply this rule to."
}
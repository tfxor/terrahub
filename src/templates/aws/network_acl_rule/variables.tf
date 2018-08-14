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
variable "network_acl_rule_network_acl_id" {
  description = "The ID of the network ACL."
}

variable "network_acl_rule_rule_number" {
  description = "The rule number for the entry (for example, 100). ACL entries are processed in ascending order by rule number."
}

variable "network_acl_rule_egress" {
  description = "Indicates whether this is an egress rule (rule is applied to traffic leaving the subnet). Default false."
}

variable "network_acl_rule_protocol" {
  description = "The protocol. A value of -1 means all protocols."
}

variable "network_acl_rule_rule_action" {
  description = " Indicates whether to allow or deny the traffic that matches the rule. Accepted values: allow-deny"
}

variable "network_acl_rule_cidr_block" {
  description = "The network range to allow or deny, in CIDR notation (for example 172.16.0.0/24 )."
}

variable "network_acl_rule_from_port" {
  description = "The from port to match."
}

variable "network_acl_rule_to_port" {
  description = "The to port to match."
}
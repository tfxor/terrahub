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
variable "network_acl_vpc_id" {
  description = "The ID of the associated VPC."
}

variable "network_acl_subnet_ids" {
  type        = "list"
  description = "A list of Subnet IDs to apply the ACL to."
}

##########
# egress #
##########
variable "network_acl_egress_protocol" {
  description = "The protocol to match. If using the -1 all protocol, you must specify a from and to port of 0."
}

variable "network_acl_egress_rule_no" {
  description = "The rule number. Used for ordering."
}

variable "network_acl_egress_action" {
  description = "The action to take."
}

variable "network_acl_egress_cidr_block" {
  description = "The CIDR block to match. This must be a valid network mask."
}

variable "network_acl_egress_from_port" {
  description = "The from port to match."
}

variable "network_acl_egress_to_port" {
  description = "The to port to match."
}

variable "network_acl_egress_icmp_type" {
  description = "The ICMP type to be used."
}

variable "network_acl_egress_icmp_code" {
  description = "The ICMP type code to be used."
}

###########
# ingress #
###########
variable "network_acl_ingress_protocol" {
  description = "The protocol to match. If using the -1 all protocol, you must specify a from and to port of 0."
}

variable "network_acl_ingress_rule_no" {
  description = "The rule number. Used for ordering."
}

variable "network_acl_ingress_action" {
  description = "The action to take."
}

variable "network_acl_ingress_cidr_block" {
  description = "The CIDR block to match. This must be a valid network mask."
}

variable "network_acl_ingress_from_port" {
  description = "The from port to match."
}

variable "network_acl_ingress_to_port" {
  description = "The to port to match."
}

variable "network_acl_ingress_icmp_type" {
  description = "The ICMP type to be used."
}

variable "network_acl_ingress_icmp_code" {
  description = "The ICMP type code to be used."
}

########
# tags #
########
variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

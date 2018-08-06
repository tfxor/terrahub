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
variable "security_group_vpc_id" {
  description = "The VPC ID."
}

###########
# ingress #
###########
variable "security_group_ingress_protocol" {
  description = "The protocol."
}

variable "security_group_ingress_self" {
  description = "If true, the security group itself will be added as a source to this ingress rule."
}

variable "security_group_ingress_from_port" {
  description = "The start port."
}

variable "security_group_ingress_to_port" {
  description = "The end range port."
}

##########
# egress #
##########
variable "security_group_egress_from_port" {
  description = "The start port."
}

variable "security_group_egress_to_port" {
  description = "The end range port."
}

variable "security_group_egress_protocol" {
  description = "The protocol."
}

variable "security_group_egress_cidr_blocks" {
  description = "List of CIDR blocks."
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

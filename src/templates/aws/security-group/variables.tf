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

variable "env" {
  description = "The name of environment."
}

#############
# top level #
#############
variable "security_group_name" {
  description = "The name of the security group."
}

variable "security_group_name_prefix" {
  description = "Creates a unique name beginning with the specified prefix. Conflicts with name."
}

variable "security_group_description" {
  description = "The security group description."
}

variable "security_group_vpc_name" {
  description = "The VPC NAME."
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

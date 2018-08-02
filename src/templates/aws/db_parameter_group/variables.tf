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
variable "db_parameter_group_name" {
  description = "The name of the DB parameter group. If omitted, Terraform will assign a random, unique name."
}

variable "db_parameter_group_family" {
  description = "The family of the DB parameter group."
}

variable "db_parameter_group_description" {
  description = "The description of the DB parameter group."
}

#############
# parameter #
#############
variable "db_parameter_group_parameter_name" {
  description = "The name of the DB parameter."
}

variable "db_parameter_group_parameter_value" {
  description = "The value of the DB parameter."
}

variable "db_parameter_group_parameter_apply_method" {
  description = "immediate or pending-reboot. Some engines can't apply some parameters without a reboot, and you will need to specify pending-reboot here."
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

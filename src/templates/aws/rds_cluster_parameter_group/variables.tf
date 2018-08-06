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
variable "rds_cluster_parameter_group_name" {
  description = "The name of the DB cluster parameter group. If omitted, Terraform will assign a random, unique name."
}

variable "rds_cluster_parameter_group_family" {
  description = "The family of the DB cluster parameter group."
}

variable "rds_cluster_parameter_group_description" {
  description = "The description of the DB cluster parameter group."
}

#############
# parameter #
#############
variable "rds_cluster_parameter_group_parameter_name" {
  description = "The name of the DB parameter."
}

variable "rds_cluster_parameter_group_parameter_value" {
  description = "The value of the DB parameter."
}

variable "rds_cluster_parameter_group_parameter_apply_method" {
  description = "Some engines can't apply some parameters without a reboot."
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

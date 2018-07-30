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
variable "db_option_group_name" {
  description = "The name of the option group. If omitted, Terraform will assign a random, unique name. Must be lowercase, to match as it is stored in AWS."
}

variable "db_option_group_description" {
  description = "The description of the option group."
}

variable "db_option_group_engine_name" {
  description = "Specifies the name of the engine that this option group should be associated with."
}

variable "db_option_group_major_engine_version" {
  description = "Specifies the major version of the engine that this option group should be associated with."
}

##########
# option #
##########
variable "db_option_group_option_name" {
  description = "The Name of the Option (e.g. MEMCACHED)."
}

variable "db_option_group_setting_name" {
  description = "The Name of the setting."
}

variable "db_option_group_setting_value" {
  description = "The Value of the setting."
}

variable "db_option_group_port" {
  description = "The Port number when connecting to the Option (e.g. 11211)."
}

variable "db_option_group_version" {
  description = "The version of the option (e.g. 13.1.0.0)."
}

variable "db_option_group_db_security_group_memberships" {
  tyep        = "list"
  description = "A list of DB Security Groups for which the option is enabled."
}

variable "db_option_group_vpc_security_group_memberships" {
  type        = "list"
  description = "A list of VPC Security Groups for which the option is enabled."
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

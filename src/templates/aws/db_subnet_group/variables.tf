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
variable "db_subnet_group_name" {
  description = "The name of the DB subnet group. If omitted, Terraform will assign a random, unique name."
}

variable "db_subnet_group_description" {
  description = "The description of the DB subnet group."
}

variable "db_subnet_group_subnet_ids" {
  type        = "list"
  description = "A list of VPC subnet IDs"
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

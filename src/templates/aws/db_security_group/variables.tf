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
variable "db_security_group_name" {
  description = "The name of the DB security group."
}

variable "db_security_group_description" {
  description = "The description of the DB security group."
}

###########
# ingress #
###########
variable "db_security_group_ingress_sg_name" {
  description = "The name of the security group to authorize."
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

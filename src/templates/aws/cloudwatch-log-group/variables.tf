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
variable "cloudwatch_log_group_name" {
  description = "The name of the log group."
}

variable "cloudwatch_log_group_tag_name" {
  description = "A name tag to assign to the resource."
}

variable "cloudwatch_log_group_tag_description" {
  description = "A description tag to assign to the resource."
}

variable "cloudwatch_log_group_tag_environment" {
  description = "A environment tag to assign to the resource."
}

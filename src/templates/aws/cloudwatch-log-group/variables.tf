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

########
# tags #
########
variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

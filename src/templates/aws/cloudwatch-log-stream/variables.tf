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
variable "cloudwatch_log_stream_name" {
  description = "The name of the log stream. Must not be longer than 512 characters and must not contain ':'"
}

variable "cloudwatch_log_stream_log_group_name" {
  description = "The name of the log group under which the log stream is to be created."
}

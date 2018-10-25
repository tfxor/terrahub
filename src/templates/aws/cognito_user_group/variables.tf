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
variable "cognito_user_group_name" {
  description = "The name of the user group."
}

variable "cognito_user_pool_id" {
  description = "The user pool ID."
}

variable "cognito_user_group_description" {
  description = "The description of the user group."
}

variable "cognito_user_group_precedence" {
  description = "The precedence of the user group."
}

variable "iam_role_name" {
  description = "The name of iam role."
}

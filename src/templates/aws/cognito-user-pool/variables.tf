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
variable "cognito_user_pool_name" {
  description = "The name of the user pool."
}

variable "cognito_user_pool_mfa_configuration" {
  description = "Set to enable multi-factor authentication. Must be one of the following values (ON, OFF, OPTIONAL)"
}

variable "cognito_user_pool_minimum_length" {
  description = "The minimum length of the password policy that you have set."
}

variable "cognito_user_pool_require_lowercase" {
  description = "Whether you have required users to use at least one lowercase letter in their password."
}

variable "cognito_user_pool_require_numbers" {
  description = "Whether you have required users to use at least one number in their password."
}

variable "cognito_user_pool_require_symbols" {
  description = "Whether you have required users to use at least one symbol in their password."
}

variable "cognito_user_pool_require_uppercase" {
  description = "Whether you have required users to use at least one uppercase letter in their password."
}

variable "cognito_user_pool_allow_admin_create_user_only" {
  description = "Set to True if only the administrator is allowed to create user profiles. Set to False if users can sign themselves up via an app."
}

variable "cognito_user_pool_unused_account_validity_days" {
  description = "The user account expiration limit, in days, after which the account is no longer usable."
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

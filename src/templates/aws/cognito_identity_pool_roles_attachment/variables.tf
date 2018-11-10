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
variable "cognito_identity_pool_id" {
  description = "An identity pool ID in the format REGION:GUID."
}

variable "cognito_iam_auth_role_name" {
  description = "The name of IAM role used for authenticated users."
}

variable "cognito_iam_unauth_role_name" {
  description = "The name of IAM role used for unauthenticated users."
}

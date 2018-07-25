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
variable "identity_pool_name" {
  description = "The name of the identity pool."
}

variable "allow_unauthenticated_identities" {
  description = "Whether the identity pool supports unauthenticated logins or not."
}

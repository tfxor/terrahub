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
variable "cloudwatch_event_permission_statement_id" {
  description = "An identifier string for the external account that you are granting permissions to."
}

variable "cloudwatch_event_permission_action" {
  description = "The action that you are enabling the other account to perform."
}

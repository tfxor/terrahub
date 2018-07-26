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
variable "api_gateway_key_name" {
  description = "The name of the API key."
}

variable "api_gateway_key_description" {
  description = "The API key description."
}

variable "api_gateway_key_enabled" {
  description = "Specifies whether the API key can be used by callers. "
}

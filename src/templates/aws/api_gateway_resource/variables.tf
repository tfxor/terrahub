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
variable "api_gateway_resource_rest_api_id" {
  description = "The ID of the associated REST API."
}

variable "api_gateway_resource_parent_id" {
  description = "The ID of the parent API resource."
}

variable "api_gateway_resource_path_part" {
  description = "The last path segment of this API resource."
  type        = "string"
}

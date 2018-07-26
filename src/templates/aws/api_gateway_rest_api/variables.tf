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
variable "api_gateway_name" {
  description = "The name of the REST API."
  type        = "string"
}

variable "api_gateway_description" {
  description = "The description of the REST API."
  type        = "string"
}

variable "api_gateway_binary_media_types" {
  description = "The list of binary media types supported by the RestApi."
  type        = "list"
}

variable "api_gateway_body" {
  description = "An OpenAPI specification that defines the set of routes and integrations to create as part of the REST API."
  type        = "string"
}

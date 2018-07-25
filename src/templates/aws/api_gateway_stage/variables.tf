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
variable "api_gateway_stage_name" {
  description = "The name of the stage."
}

variable "aws_api_gateway_rest_api_id" {
  description = "The ID of the associated REST API."
}

variable "aws_api_gateway_deployment_id" {
  description = "The ID of the deployment that the stage points to."
}

variable "aws_api_gateway_cache_cluster_enabled" {
  description = "Specifies whether a cache cluster is enabled for the stage"
}

variable "aws_api_gateway_cache_cluster_size" {
  description = "The size of the cache cluster for the stage, if enabled. Allowed values include 0.5, 1.6, 6.1, 13.5, 28.4, 58.2, 118 and 237."
}

variable "aws_api_gateway_client_certificate_id" {
  description = "The identifier of a client certificate for the stage."
}

variable "aws_api_gateway_description" {
  description = "The description of the stage"
}

variable "aws_api_gateway_documentation_version" {
  description = "The version of the associated API documentation"
}

variable "aws_api_gateway_variables" {
  description = "A map that defines the stage variables"
  type        = "map"
}

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
variable "api_gateway_rest_api_id" {
  description = "The ID of the associated REST API."
}

variable "api_gateway_deployment_description" {
  description = "The description of the deployment."
}

variable "api_gateway_deployment_stage_name" {
  description = "The name of the stage."
}

variable "api_gateway_deployment_stage_description" {
  description = "The description of the stage."
}

#variable "api_gateway_deployment_variables" {
#  description = "A map that defines variables for the stage"
#  type = "map"
#}

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

############
# provider #
############
variable "api_gateway_response_rest_api_id" {
  description = "The string identifier of the associated REST API."
  type        = "string"
}

variable "api_gateway_response_response_type" {
  description = "The response type of the associated GatewayResponse."
  type        = "string"
}

variable "api_gateway_response_status_code" {
  description = "The HTTP status code of the Gateway Response."
  type        = "string"
}

variable "api_gateway_response_parameters" {
  description = "A map specifying the templates used to transform the response body."
  type        = "map"
}

variable "api_gateway_response_templates" {
  description = "A map specifying the parameters (paths, query strings and headers) of the Gateway Response."
  type        = "map"
}

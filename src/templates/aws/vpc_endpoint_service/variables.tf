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
variable "vpc_endpoint_acceptance_required" {
  description = "Whether or not VPC endpoint connection requests to the service must be accepted by the service owner - true or false."
}

variable "vpc_endpoint_network_load_balancer_arns" {
  type        = "list"
  description = "The ARNs of one or more Network Load Balancers for the endpoint service."
}

variable "vpc_endpoint_allowed_principals" {
  description = "The ARNs of one or more principals allowed to discover the endpoint service."
}

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
variable "vpn_gateway_route_propagation_vpn_gateway_id" {
  description = "The id of the aws_vpn_gateway to propagate routes from."
}

variable "vpn_gateway_route_propagation_route_table_id" {
  description = "The id of the aws_route_table to propagate routes into."
}
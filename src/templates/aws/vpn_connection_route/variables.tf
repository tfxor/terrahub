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
variable "vpn_connection_route_destination_cidr_block" {
  description = "The CIDR block associated with the local subnet of the customer network."
}

variable "vpn_connection_route_vpn_connection_id" {
  description = "The ID of the VPN connection."
}
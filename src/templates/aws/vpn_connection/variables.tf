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
variable "vpn_connection_vpn_gateway_id" {
  description = "The ID of the virtual private gateway."
}

variable "vpn_connection_customer_gateway_id" {
  description = "The ID of the customer gateway."
}

variable "vpn_connection_type" {
  description = "The type of VPN connection. The only type AWS supports at this time is ipsec.1."
}

variable "vpn_connection_static_routes_only" {
  description = "Whether the VPN connection uses static routes exclusively. Static routes must be used for devices that don't support BGP."
}

########
# tags #
########
variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

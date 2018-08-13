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
variable "vpn_gateway_vpc_id" {
  description = "The VPC ID to create in."
}

variable "vpn_gateway_availability_zone" {
  description = "The Availability Zone for the virtual private gateway."
}

variable "vpn_gateway_amazon_side_asn" {
  description = "The Autonomous System Number (ASN) for the Amazon side of the gateway. If you don't specify an ASN, the virtual private gateway is created with the default ASN."
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

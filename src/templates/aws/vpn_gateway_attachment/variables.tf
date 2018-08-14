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
variable "vpn_gateway_attachment_vpc_id" {
  description = "The ID of the VPC."
}

variable "vpn_gateway_attachment_vpn_gateway_id" {
  description = "The ID of the Virtual Private Gateway."
}
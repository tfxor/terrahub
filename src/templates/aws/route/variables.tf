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
variable "route_route_table_id" {
  description = "The ID of the routing table."
}

variable "route_destination_cidr_block" {
  description = "The destination IPv6 CIDR block."
}

variable "route_egress_only_gateway_id" {
  description = "An ID of a VPC Egress Only Internet Gateway."
}

variable "route_gateway_id" {
  description = "An ID of a VPC internet gateway or a virtual private gateway."
}

variable "route_nat_gateway_id" {
  description = "An ID of a VPC NAT gateway."
}
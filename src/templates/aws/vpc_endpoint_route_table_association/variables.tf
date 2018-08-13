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
variable "vpc_endpoint_vpc_endpoint_id" {
  description = "The ID of the VPC endpoint with which the routing table will be associated."
}

variable "vpc_endpoint_route_table_id" {
  description = "The ID of the routing table to be associated with the VPC endpoint."
}
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
variable "vpc_ipv4_cidr_block_association_vpc_id" {
  description = "The ID of the VPC to make the association with."
}

variable "vpc_ipv4_cidr_block_association_cidr_block" {
  description = "The additional IPv4 CIDR block to associate with the VPC."
}

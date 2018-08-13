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
variable "vpc_dhcp_options_association_vpc_id" {
  description = "The ID of the VPC to which we would like to associate a DHCP Options Set."
}

variable "vpc_dhcp_options_association_dhcp_options_id" {
  description = "The ID of the DHCP Options Set to associate to the VPC."
}
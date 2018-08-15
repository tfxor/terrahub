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
variable "route_table_association_subnet_id" {
  description = "The subnet ID to create an association."
}

variable "route_table_association_route_table_id" {
  description = "The ID of the routing table to associate with."
}
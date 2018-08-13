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
variable "route_table_vpc_id" {
  description = "The VPC ID."
}

variable "route_table_propagating_vgws" {
  description = "A list of virtual gateways for propagation."
}

#########
# route #
#########
variable "route_table_route_cidr_block" {
  description = "The CIDR block of the route."
}

variable "route_table_route_gateway_id" {
  description = "The Internet Gateway ID."
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

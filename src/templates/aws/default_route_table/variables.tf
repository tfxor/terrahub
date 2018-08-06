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
variable "default_route_table_id" {
  description = "The ID of the Default Routing Table."
}

variable "default_route_table_propagating_vgws" {
  type        = "list"
  description = "A list of virtual gateways for propagation."
}

#########
# route #
#########
variable "default_route_table_cidr_block" {
  description = "The CIDR block of the route."
}

variable "default_route_table_egress_only_gateway_id" {
  description = "The Egress Only Internet Gateway ID."
}

variable "default_route_table_gateway_id" {
  description = "The Internet Gateway ID."
}

variable "default_route_table_nat_gateway_id" {
  description = "The NAT Gateway ID."
}

variable "default_route_table_instance_id" {
  description = "The EC2 instance ID."
}

variable "default_route_table_vpc_peering_connection_id" {
  description = "The VPC Peering ID."
}

variable "default_route_table_network_interface_id" {
  description = "The ID of the elastic network interface (eni) to use."
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

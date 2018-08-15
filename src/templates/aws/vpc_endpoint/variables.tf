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
variable "vpc_endpoint_vpc_id" {
  description = "The ID of the VPC in which the endpoint will be used."
}

variable "vpc_endpoint_service_name" {
  description = "The service name, in the form com.amazonaws.region.service for AWS services."
}

variable "vpc_endpoint_vpc_endpoint_type" {
  description = "The VPC endpoint type, Gateway or Interface. Defaults to Gateway."
}

variable "vpc_endpoint_security_group_ids" {
  type        = "list"
  description = "The ID of one or more security groups to associate with the network interface. Required for endpoints of type Interface."
}

variable "vpc_endpoint_subnet_ids" {
  type        = "list"
  description = "The ID of one or more subnets in which to create a network interface for the endpoint. Applicable for endpoints of type Interface."
}

variable "vpc_endpoint_private_dns_enabled" {
  description = "Whether or not to associate a private hosted zone with the specified VPC. Applicable for endpoints of type Interface."
}
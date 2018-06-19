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
variable "subnet_aws_vpc_id" {
  description = "The VPC ID."
}

variable "subnet_availability_zone" {
  description = "The AZ for the subnet."
}

variable "subnet_cidr_block" {
  description = "The CIDR block for the subnet."
}

variable "subnet_map_public_ip_on_launch" {
  description = "Specify true to indicate that instances launched into the subnet should be assigned a public IP address. Default is false."
}

variable "subnet_assign_ipv6_address_on_creation" {
  description = "Specify true to indicate that network interfaces created in the specified subnet should be assigned an IPv6 address. Default is false"
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

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

variable "vpc_cidr_block" {
  description = "The CIDR block of the VPC."
}

variable "vpc_instance_tenancy" {
  description = "Tenancy of instances spin up within VPC."
}

variable "vpc_enable_dns_support" {
  description = "Whether or not the VPC has DNS support."
}

variable "vpc_enable_dns_hostnames" {
  description = "Whether or not the VPC has DNS hostname support."
}

variable "vpc_enable_classiclink" {
  description = "Whether or not the VPC has Classiclink enabled."
}

variable "vpc_enable_classiclink_dns_support" {
  description = "A boolean flag to enable/disable ClassicLink DNS Support for the VPC. Only valid in regions and accounts that support EC2 Classic."
}

variable "vpc_assign_generated_ipv6_cidr_block" {
  description = "Requests an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC. You cannot specify the range of IP addresses, or the size of the CIDR block. Default is false."
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

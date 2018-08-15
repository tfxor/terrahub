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
variable "vpc_peering_connection_peer_vpc_id" {
  description = "The ID of the VPC with which you are creating the VPC Peering Connection."
}

variable "vpc_peering_connection_vpc_id" {
  description = "The ID of the requester VPC."
}

variable "vpc_peering_connection_accepter_allow_remote" {
  description = "Allow a local VPC to resolve public DNS hostnames to private IP addresses when queried from instances in the peer VPC."
}

variable "vpc_peering_connection_requester_allow_remote" {
  description = "Allow a local VPC to resolve public DNS hostnames to private IP addresses when queried from instances in the peer VPC."
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

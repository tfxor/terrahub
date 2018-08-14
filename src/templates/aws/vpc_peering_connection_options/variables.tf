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
variable "vpc_peering_connection_options_connection_id" {
  description = "The ID of the requester VPC peering connection."
}

variable "vpc_peering_accepter_allow_remote_vpc_dns_resolution" {
  description = "Allow a local VPC to resolve public DNS hostnames to private IP addresses when queried from instances in the peer VPC."
}

variable "vpc_peering_accepter_allow_vpc_to_remote_classic_link" {
  description = "Allow a local VPC to communicate with a linked EC2-Classic instance in a peer VPC. This enables an outbound communication from the local VPC to the remote ClassicLink connection."
}

variable "vpc_peering_accepter_allow_classic_link_to_remote_vpc" {
  description = "Allow a local linked EC2-Classic instance to communicate with instances in a peer VPC. This enables an outbound communication from the local ClassicLink connection to the remote VPC."
}

variable "vpc_peering_requester_allow_remote_vpc_dns_resolution" {
  description = "Allow a local VPC to resolve public DNS hostnames to private IP addresses when queried from instances in the peer VPC."
}

variable "vpc_peering_requester_allow_vpc_to_remote_classic_link" {
  description = "Allow a local VPC to communicate with a linked EC2-Classic instance in a peer VPC. This enables an outbound communication from the local VPC to the remote ClassicLink connection."
}

variable "vpc_peering_requester_allow_classic_link_to_remote_vpc" {
  description = "Allow a local linked EC2-Classic instance to communicate with instances in a peer VPC. This enables an outbound communication from the local ClassicLink connection to the remote VPC."
}

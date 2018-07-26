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
variable "eip_association_allocation_id" {
  description = "The allocation ID. This is required for EC2-VPC."
}

variable "eip_association_allow_reassociation" {
  description = "Whether to allow an Elastic IP to be re-associated. Defaults to true in VPC."
}

variable "eip_association_instance_id" {
  description = "The ID of the instance. This is required for EC2-Classic. For EC2-VPC, you can specify either the instance ID or the network interface ID, but not both. The operation fails if you specify an instance ID unless exactly one network interface is attached."
}

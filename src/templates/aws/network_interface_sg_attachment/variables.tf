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
variable "network_interface_sg_attachment_security_group_id" {
  description = "The ID of the security group."
}

variable "network_interface_sg_attachment_network_interface_id" {
  description = "The ID of the network interface to attach to."
}
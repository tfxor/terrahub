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
variable "network_interface_attachment_instance_id" {
  description = "Instance ID to attach."
}

variable "network_interface_attachment_network_interface_id" {
  description = "ENI ID to attach."
}

variable "network_interface_attachment_device_index" {
  description = "Network interface index (int)."
}
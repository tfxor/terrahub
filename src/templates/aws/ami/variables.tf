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
variable "ami_name" {
  description = "A region-unique name for the AMI."
}

variable "ami_description" {
  description = "A longer, human-readable description for the AMI."
}

variable "ami_root_device_name" {
  description = "The name of the root device."
}

variable "ami_virtualization_type" {
  description = "Keyword to choose what virtualization mode created instances will use."
}

variable "ami_architecture" {
  description = "Machine architecture for created instances."
}

####################
# ebs_block_device #
####################
variable "ami_device_name" {
  description = "The path at which the device is exposed to created instances."
}

variable "ami_delete_on_termination" {
  description = "Boolean controlling whether the EBS volumes created to support each created instance will be deleted once that instance is terminated."
}

variable "ami_encrypted" {
  description = "Boolean controlling whether the created EBS volumes will be encrypted."
}

variable "ami_volume_size" {
  description = "The size of created volumes in GiB. If snapshot_id is set and volume_size is omitted then the volume will have the same size as the selected snapshot."
}

variable "ami_volume_type" {
  description = "The type of EBS volume to create. Can be one of standard (the default), io1 or gp2."
}
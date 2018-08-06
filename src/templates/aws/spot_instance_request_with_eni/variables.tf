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
variable "instance_name" {
  description = "The name of instance."
}

variable "instance_ami" {
  description = "The AMI to use for the instance."
}

variable "instance_instance_type" {
  description = "The type of instance to start. Updates to this field will trigger a stop/start of the EC2 instance."
}

variable "instance_key_name" {
  description = "The key name of the Key Pair to use for the instance; which can be managed using the aws_key_pair resource."
}

variable "instance_iam_instance_profile" {
  description = "The IAM Instance Profile to launch the instance with. Specified as the name of the Instance Profile. Ensure your credentials have the correct permission to assign the instance profile according to the EC2 documentation, notably iam:PassRole."
}

variable "instance_ebs_optimized" {
  description = "If true, the launched EC2 instance will be EBS-optimized. Note that if this is not set on an instance type that is optimized by default then this will show as disabled but if the instance type is optimized by default then there is no need to set this and there is no effect to disabling it."
}

variable "instance_disable_api_termination" {
  description = "If true, enables EC2 Instance Termination Protection."
}

variable "instance_monitoring" {
  description = "If true, the launched EC2 instance will have detailed monitoring enabled."
}

variable "instance_spot_price" {
  description = "The maximum price to request on the spot market."
}

variable "instance_wait_for_fulfillment" {
  description = "If set, Terraform will wait for the Spot Request to be fulfilled, and will throw an error if the timeout of 10m is reached."
}

variable "instance_spot_type" {
  description = "If set to one-time, after the instance is terminated, the spot request will be closed."
}

variable "instance_launch_group" {
  description = "A launch group is a group of spot instances that launch together and terminate together. If left empty instances are launched and terminated individually."
}

variable "instance_block_duration_minutes" {
  description = "The required duration for the Spot instances, in minutes. This value must be a multiple of 60 (60, 120, 180, 240, 300, or 360). The duration period starts as soon as your Spot instance receives its instance ID."
}

#####################
# network_interface #
#####################
variable "instance_network_interface_id" {
  description = "The ID of the network interface to attach."
}

variable "instance_device_index" {
  description = "The integer index of the network interface attachment. Limited by instance type."
}

variable "instance_delete_on_termination" {
  description = "Whether or not to delete the network interface on instance termination. Defaults to false. Currently, the only valid value is false, as this is only supported when creating new network interfaces when launching an instance."
}

####################
# ebs block device #
####################
variable "instance_ebs_device_name" {
  description = "The name of the device to mount."
}

variable "instance_ebs_volume_type" {
  description = "The type of volume. Can be standard, gp2, or io1. (Default: standard)."
}

variable "instance_ebs_volume_size" {
  description = "The size of the volume in gigabytes."
}

variable "instance_ebs_delete_on_termination" {
  description = "Whether the volume should be destroyed on instance termination (Default: true)."
}

variable "instance_ebs_encrypted" {
  description = "Enables EBS encryption on the volume (Default: false). Cannot be used with snapshot_id."
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

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

variable "instance_vpc_security_group_ids" {
  type        = "list"
  description = "A list of security group IDs to associate with."
}

variable "instance_subnet_id" {
  description = "The VPC Subnet ID to launch in."
}

variable "associate_public_ip_address" {
  description = "Associate a public ip address with an instance in a VPC. Boolean value."
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

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
variable "launch_template_name" {
  description = "The name of the launch template. If you leave this blank, Terraform will auto-generate a unique name."
}

variable "launch_template_api_termination" {
  description = "If true, enables EC2 Instance Termination Protection."
}

variable "launch_template_ebs_optimized" {
  description = "If true, the launched EC2 instance will be EBS-optimized."
}

variable "launch_template_image_id" {
  description = "The AMI from which to launch the instance."
}

variable "launch_template_shutdown_behavior" {
  description = "Shutdown behavior for the instance. Can be stop or terminate. "
}

variable "launch_template_instance_type" {
  description = "The type of the instance."
}

variable "launch_template_kernel_id" {
  description = "The kernel ID."
}

variable "launch_template_key_name" {
  description = "The key name to use for the instance."
}

variable "launch_template_ram_disk_id" {
  description = "The ID of the RAM disk."
}

variable "launch_template_vpc_security_group_ids" {
  type        = "list"
  description = "A list of security group IDs to associate with."
}

#########################
# block device mappings #
#########################
variable "launch_template_ebs_device_name" {
  description = "The name of the device to mount."
}

variable "launch_template_ebs_delete_on_termination" {
  description = "Whether the volume should be destroyed on instance termination."
}

variable "launch_template_ebs_encrypted" {
  description = "Enables EBS encryption on the volume (Default: false). Cannot be used with snapshot_id."
}

variable "launch_template_ebs_volume_size" {
  description = "The size of the volume in gigabytes."
}

variable "launch_template_ebs_volume_type" {
  description = "The type of volume. Can be standard, gp2, or io1."
}

#########################
# additional attributes #
#########################
variable "launch_template_cpu_credits" {
  description = "The credit option for CPU usage. Can be standard or unlimited."
}

variable "launch_template_elastic_gpu_type" {
  description = "The Elastic GPU Type."
}

variable "launch_template_iam_name" {
  description = "The name of the instance profile."
}

variable "launch_template_market_type" {
  description = "The market type. Can be spot."
}

variable "launch_template_monitoring_enabled" {
  description = "If true, the launched EC2 instance will have detailed monitoring enabled."
}

variable "launch_template_availability_zone" {
  description = "The Availability Zone for the instance."
}

######################
# network_interfaces #
######################
variable "launch_template_ni_associate_public_ip_address" {
  description = "Associate a public ip address with the network interface. Boolean value."
}

variable "launch_template_ni_subnet_id" {
  description = "The VPC Subnet ID to associate."
}

########
# tags #
########
variable "launch_template_resource_type" {
  description = "The type of resource to tag. Valid values are instance and volume."
}

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

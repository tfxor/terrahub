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
variable "efs_mount_target_file_system_id" {
  description = "The ID of the file system for which the mount target is intended."
}

variable "efs_mount_target_subnet_id" {
  description = "The ID of the subnet to add the mount target in."
}

variable "efs_mount_target_ip_address" {
  description = "The address (within the address range of the specified subnet) at which the file system may be mounted via the mount target."
}

variable "efs_mount_target_security_groups" {
  type        = "list"
  description = "A list of up to 5 VPC security group IDs (that must be for the same VPC as subnet specified) in effect for the mount target."
}

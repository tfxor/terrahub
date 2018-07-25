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
variable "ebs_volume_availability_zone" {
  description = "The AZ where the EBS volume will exist."
}

variable "ebs_volume_size" {
  description = "The size of the drive in GiBs."
}

variable "ebs_volume_encrypted" {
  description = "If true, the disk will be encrypted."
}

variable "ebs_volume_type" {
  description = "The type of EBS volume. Can be standard, gp2, io1, sc1 or st1 (Default: standard)."
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

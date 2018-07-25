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
variable "ami_copy_name" {
  description = "A region-unique name for the AMI."
}

variable "ami_copy_description" {
  description = "A description for the AMI."
}

variable "ami_copy_source_ami_id" {
  description = "The id of the AMI to copy. This id must be valid in the region given by source_ami_region."
}

variable "ami_copy_encrypted" {
  description = "Specifies whether the destination snapshots of the copied image should be encrypted. "
}

variable "ami_copy_source_ami_region" {
  description = "The region from which the AMI will be copied. This may be the same as the AWS provider region in order to create a copy within the same region."
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

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
variable "launch_configuration_name" {
  description = "The name of the launch configuration. If you leave this blank, Terraform will auto-generate a unique name."
}

variable "launch_configuration_image_id" {
  description = "The EC2 image ID to launch."
}

variable "launch_configuration_instance_type" {
  description = "The size of instance to launch."
}

variable "launch_configuration_iam_instance_profile" {
  description = "The IAM instance profile to associate with launched instances."
}

variable "launch_configuration_security_groups" {
  type        = "list"
  description = "A list of associated security group IDS."
}

variable "launch_configuration_key_name" {
  description = "The key name that should be used for the instance."
}

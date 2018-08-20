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
variable "ssm_parameter_name" {
  description = "The name of the parameter."
}

variable "ssm_parameter_description" {
  description = "The description of the parameter."
}

variable "ssm_parameter_type" {
  description = "The type of the parameter. Valid types are String, StringList and SecureString."
}

variable "ssm_parameter_key_id" {
  description = "The KMS key id or arn for encrypting a SecureString."
}

variable "ssm_parameter_value" {
  description = "The value of the parameter."
}

variable "ssm_parameter_overwrite" {
  description = "Overwrite an existing parameter. If not specified, will default to false if the resource has not been created by terraform to avoid overwrite of existing resource and will default to true otherwise (terraform lifecycle rules should then be used to manage the update behavior)."
}

variable "ssm_parameter_allowed_pattern" {
  description = "A regular expression used to validate the parameter value."
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

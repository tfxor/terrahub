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
variable "route53_name" {
  description = "This is the name of the hosted zone."
}

variable "route53_comment" {
  description = "A comment for the hosted zone. Defaults to 'Managed by Terraform'."
}

variable "route53_force_destroy" {
  description = "Whether to destroy all records (possibly managed outside of Terraform) in the zone when destroying the zone."
}

variable "route53_vpc_id" {
  description = "The VPC to associate with a private hosted zone. Specifying vpc_id will create a private hosted zone. Conflicts with delegation_set_id as delegation sets can only be used for public zones."
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

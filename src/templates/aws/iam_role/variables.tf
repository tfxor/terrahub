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

############
# iam role #
############
variable "iam_role_name" {
  description = "The name of the role. If omitted, Terraform will assign a random, unique name."
  type        = "string"
}

variable "iam_role_description" {
  description = "The description of the role."
  type        = "string"
}

variable "iam_role_path" {
  description = "The path of the role."
  type        = "string"
}

variable "iam_role_force_detach_policies" {
  description = "Specifies to force detaching any policies the role has before destroying it. Defaults to false."
  type        = "string"
}

##############
# iam policy #
##############
variable "iam_role_policy_sid" {
  description = "An ID for the policy statement."
  type        = "string"
}

variable "iam_role_policy_actions" {
  description = "A list of actions that this statement either allows or denies."
  type        = "list"
}

variable "iam_role_policy_effect" {
  description = "Either Allow or Deny, to specify whether this statement allows or denies the given actions."
  type        = "string"
}

variable "iam_role_policy_principals_type" {
  description = "The type of principal. For AWS accounts this is AWS."
  type        = "string"
}

variable "iam_role_policy_principals_identifiers" {
  description = "List of identifiers for principals. When type is AWS, these are IAM user or role ARNs."
  type        = "list"
}

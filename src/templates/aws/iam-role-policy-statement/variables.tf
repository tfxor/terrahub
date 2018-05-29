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
  description = "The role name."
}

variable "iam_role_description" {
  description = "The role description."
}

variable "iam_role_path" {
  description = "The role path."
}

##############
# iam policy #
##############
variable "iam_policy_name" {
  description = "The policy name."
}

variable "iam_policy_description" {
  description = "The policy description."
}

variable "iam_policy_path" {
  description = "The policy path."
}

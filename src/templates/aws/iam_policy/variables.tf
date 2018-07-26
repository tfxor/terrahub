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

###############
# iam  policy #
###############
variable "iam_policy_name" {
  description = "The name of policy."
  type        = "string"
}

variable "iam_policy_description" {
  description = "The description of policy."
  type        = "string"
}

variable "iam_policy_path" {
  description = "The path of policy."
  type        = "string"
}

variable "iam_policy_sid" {
  description = "The sid of policy."
  type        = "string"
}

variable "iam_policy_actions" {
  description = "A list of actions, separate with ','."
  type        = "string"
}

variable "iam_policy_resources" {
  description = "A list of resources, separate with ','."
  type        = "string"
}

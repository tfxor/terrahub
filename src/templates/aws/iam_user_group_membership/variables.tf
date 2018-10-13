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
# iam user #
############
variable "iam_user_name" {
  description = "The name of the IAM User to add to groups."
  type        = "string"
}

##############
# iam groups #
##############
variable "iam_groups_name" {
  description = "A list of IAM Groups to add the user to."
  type        = "list"
}

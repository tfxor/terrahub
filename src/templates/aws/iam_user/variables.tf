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

variable "iam_user_name" {
  description = "The user's name. The name must consist of upper and lowercase alphanumeric characters with no spaces. You can also include any of the following characters: =,.@-_.. User names are not distinguished by case."
}

variable "iam_user_path" {
  description = "Path in which to create the user."
}

variable "iam_user_force_destroy" {
  description = "When destroying this user, destroy even if it has non-Terraform-managed IAM access keys, login profile or MFA devices. Without force_destroy a user with non-Terraform-managed access keys and login profile will fail to be destroyed."
}

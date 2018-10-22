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
variable "iam_group_name" {
  description = "The group's name. The name must consist of upper and lowercase alphanumeric characters with no spaces. You can also include any of the following characters: =,.@-_.. Group names are not distinguished by case."
}

variable "iam_group_path" {
  description = "Path in which to create the group."
}

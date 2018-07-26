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
variable "snapshot_create_volume_permission_snapshot_id" {
  description = "A snapshot ID."
}

variable "snapshot_create_volume_permission_account_id" {
  description = "An AWS Account ID to add create volume permissions."
}

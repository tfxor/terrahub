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
variable "db_snapshot_instance_identifier" {
  description = "The DB Instance Identifier from which to take the snapshot."
}

variable "db_snapshot_identifier" {
  description = "The Identifier for the snapshot."
}
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
variable "ami_from_instance_name" {
  description = "A region-unique name for the AMI."
}

variable "ami_from_instance_source_instance_id" {
  description = "The id of the instance to use as the basis of the AMI."
}

variable "ami_from_instance_snapshot_without_reboot" {
  description = "Boolean that overrides the behavior of stopping the instance before snapshotting. This is risky since it may cause a snapshot of an inconsistent filesystem state, but can be used to avoid downtime if the user otherwise guarantees that no filesystem writes will be underway at the time of snapshot."
}

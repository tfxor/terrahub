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
variable "elb_attachment_elb" {
  description = "The name of the ELB."
}

variable "elb_attachment_instance" {
  description = "Instance ID to place in the ELB pool."
}


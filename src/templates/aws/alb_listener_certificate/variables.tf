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
variable "lb_listener_certificate_listener_arn" {
  description = "The ARN of the listener to which to attach the certificate."
}

variable "lb_listener_certificate_certificate_name" {
  description = "The NAME of the certificate to attach to the listener."
}

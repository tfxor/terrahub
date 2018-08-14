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
variable "vpc_endpoint_vpc_endpoint_service_id" {
  description = "The ID of the VPC Endpoint Service to receive notifications for."
}

variable "vpc_endpoint_vpc_endpoint_id" {
  description = "The ID of the VPC Endpoint to receive notifications for."
}

variable "vpc_endpoint_connection_notification_arn" {
  description = "The ARN of the SNS topic for the notifications."
}

variable "vpc_endpoint_connection_events" {
  type        = "list"
  description = "One or more endpoint events for which to receive notifications."
}

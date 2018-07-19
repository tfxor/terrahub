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
variable "lb_target_group_attachment_target_group_arn" {
  description = "The ARN of the target group with which to register targets."
}

variable "lb_target_group_attachment_target_id" {
  description = "The ID of the target. This is the Instance ID for an instance, or the container ID for an ECS container. If the target type is ip, specify an IP address."
}

variable "lb_target_group_attachment_port" {
  description = "The port on which targets receive traffic."
}

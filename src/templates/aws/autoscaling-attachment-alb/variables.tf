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
variable "autoscaling_attachment_autoscaling_group_name" {
  description = "Name of ASG to associate with the ELB."
}

variable "autoscaling_attachment_alb_target_group_arn" {
  description = "The ARN of an ALB Target Group."
}

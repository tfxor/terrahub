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
variable "app_cookie_stickiness_policy_name" {
  description = "The name of the stickiness policy."
}

variable "app_cookie_stickiness_policy_load_balancer" {
  description = "The name of load balancer to which the policy should be attached."
}

variable "app_cookie_stickiness_policy_lb_port" {
  description = "The load balancer port to which the policy should be applied. This must be an active listener on the load balancer."
}

variable "app_cookie_stickiness_policy_cookie_name" {
  description = "The application cookie whose lifetime the ELB's cookie should follow."
}
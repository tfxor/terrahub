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
variable "lb_cookie_stickiness_policy_name" {
  description = "The name of the stickiness policy."
}

variable "lb_cookie_stickiness_policy_load_balancer" {
  description = "The load balancer to which the policy should be attached."
}

variable "lb_cookie_stickiness_policy_lb_port" {
  description = "The load balancer port to which the policy should be applied. This must be an active listener on the load balancer."
}

variable "lb_cookie_expiration_period" {
  description = "The time period after which the session cookie should be considered stale, expressed in seconds."
}
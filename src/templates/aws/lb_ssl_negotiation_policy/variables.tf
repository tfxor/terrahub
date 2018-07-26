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
variable "lb_ssl_negotiation_policy_name" {
  description = "The name of the SSL negotiation policy."
}

variable "lb_ssl_negotiation_policy_lb" {
  description = "The load balancer to which the policy should be attached."
}

variable "lb_ssl_negotiation_policy_lb_port" {
  description = "The load balancer port to which the policy should be applied. This must be an active listener on the load balancer."
}

variable "lb_ssl_negotiation_policy_attribut" {
  type        = "map"
  description = "An SSL Negotiation policy attribute. Each has two properties: name - The name of the attribute, value - The value of the attribute"
}

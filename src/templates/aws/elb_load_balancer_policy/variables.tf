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
variable "lb_policy_lb_name" {
  description = "The load balancer on which the policy is defined."
}

variable "lb_policy_name" {
  description = "The name of the load balancer policy."
}

variable "lb_policy_type_name" {
  description = "The policy type."
}

variable "lb_policy_attribute" {
  type        = "map"
  description = "Policy attribute to apply to the policy."
}

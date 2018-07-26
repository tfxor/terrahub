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
variable "proxy_protocol_policy_load_balancer" {
  description = "The load balancer to which the policy should be attached."
}

variable "proxy_protocol_policy_instance_ports" {
  type        = "list"
  description = "List of instance ports to which the policy should be applied. This can be specified if the protocol is SSL or TCP."
}

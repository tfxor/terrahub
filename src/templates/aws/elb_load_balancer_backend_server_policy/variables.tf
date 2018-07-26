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
variable "load_balancer_backend_server_policy_load_balancer_name" {
  description = "The load balancer to attach the policy to."
}

variable "load_balancer_backend_server_policy_instance_port" {
  description = "The instance port to apply the policy to."
}

variable "load_balancer_backend_server_policy_names" {
  type        = "list"
  description = "List of Policy Names to apply to the backend server."
}

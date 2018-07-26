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
variable "lb_listener_load_balancer_arn" {
  description = "The ARN of the load balancer."
}

variable "lb_listener_port" {
  description = "The port on which the load balancer is listening."
}

variable "lb_listener_protocol" {
  description = "The protocol for connections from clients to the load balancer. Valid values are TCP, HTTP and HTTPS."
}

###########################
# default_action atribute #
###########################
variable "lb_listener_target_group_arn" {
  description = "The ARN of the Target Group to which to route traffic."
}

variable "lb_listener_type" {
  description = "The type of routing action. The only valid value is forward."
}

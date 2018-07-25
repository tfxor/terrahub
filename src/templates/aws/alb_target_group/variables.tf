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
variable "lb_target_group_name" {
  description = "The name of the target group. If omitted, Terraform will assign a random, unique name."
}

variable "lb_target_group_port" {
  description = "The port on which targets receive traffic, unless overridden when registering a specific target."
}

variable "lb_target_group_protocol" {
  description = "The protocol to use for routing traffic to the targets."
}

variable "lb_target_group_vpc_id" {
  description = "The identifier of the VPC in which to create the target group."
}

variable "lb_target_group_deregistration_delay" {
  description = "The amount time for Elastic Load Balancing to wait before changing the state of a deregistering target from draining to unused. The range is 0-3600 seconds."
}

variable "lb_target_group_slow_start" {
  description = "The amount time for targets to warm up before the load balancer sends them a full share of requests. The range is 30-900 seconds or 0 to disable."
}

variable "lb_target_group_proxy_protocol_v2" {
  description = "Boolean to enable / disable support for proxy protocol v2 on Network Load Balancers."
}

#######################
# stickiness atribute #
#######################
variable "lb_target_group_type" {
  description = "The type of sticky sessions. The only current possible value is lb_cookie."
}

variable "lb_target_group_cookie_duration" {
  description = "The time period, in seconds, during which requests from a client should be routed to the same target. After this time period expires, the load balancer-generated cookie is considered stale. The range is 1 second to 1 week (604800 seconds)."
}

variable "lb_target_group_enabled" {
  description = "Boolean to enable / disable stickiness."
}

#########################
# health_check atribute #
#########################
variable "lb_target_group_health_check_interval" {
  description = "The approximate amount of time, in seconds, between health checks of an individual target. Minimum value 5 seconds, Maximum value 300 seconds."
}
variable "lb_target_group_health_check_path" {
  description = "The destination for the health check request. Applies to Application Load Balancers only (HTTP/HTTPS), not Network Load Balancers (TCP)."
}

variable "lb_target_group_health_check_port" {
  description = "The port to use to connect with the target. Valid values are either ports 1-65536, or traffic-port. "
}

variable "lb_target_group_health_check_protocol" {
  description = "The protocol to use to connect with the target."
}

variable "lb_target_group_health_check_timeout" {
  description = "The amount of time, in seconds, during which no response means a failed health check. For Application Load Balancers, the range is 2 to 60 seconds and the default is 5 seconds. For Network Load Balancers, you cannot set a custom value, and the default is 10 seconds for TCP and HTTPS health checks and 6 seconds for HTTP health checks."
}

variable "lb_target_group_healthy_threshold" {
  description = "The number of consecutive health checks successes required before considering an unhealthy target healthy."
}

variable "lb_target_group_unhealthy_threshold" {
  description = "The number of consecutive health check failures required before considering the target unhealthy . For Network Load Balancers, this value must be the same as the healthy_threshold."
}

########
# tags #
########
variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

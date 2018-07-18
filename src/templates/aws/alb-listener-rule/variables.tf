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
variable "lb_listener_rule_listener_arn" {
  description = "The ARN of the listener to which to attach the rule."
}

variable "lb_listener_rule_priority" {
  description = "The priority for the rule between 1 and 50000. Leaving it unset will automatically set the rule with next available priority after currently existing highest rule. A listener can't have multiple rules with the same priority."
}

variable "lb_listener_rule_action_type" {
  description = "The type of routing action. The only valid value is forward."
}

variable "lb_listener_rule_action_target_group_arn" {
  description = "The ARN of the Target Group to which to route traffic."
}

variable "lb_listener_rule_condition_field" {
  description = " The name of the field. Must be one of path-pattern for path based routing or host-header for host based routing."
}

variable "lb_listener_rule_condition_values" {
  type        = "list"
  description = "The path patterns to match. A maximum of 1 can be defined."
}

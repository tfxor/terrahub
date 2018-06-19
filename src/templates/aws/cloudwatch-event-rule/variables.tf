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
variable "cloudwatch_event_rule_name" {
  description = "The rule's name."
}

variable "cloudwatch_event_rule_event_pattern" {
  description = "Event pattern described a JSON object. See full documentation of CloudWatch Events and Event Patterns for details."
}

variable "cloudwatch_event_rule_description" {
  description = "The description of the rule."
}

variable "cloudwatch_event_rule_is_enabled" {
  description = "Whether the rule should be enabled."
}

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

variable "cloudwatch_event_target_rule" {
  description = "The name of the rule you want to add targets to."
}

variable "cloudwatch_event_target_target_id" {
  description = "The unique target assignment ID. If missing, will generate a random, unique id."
}

variable "cloudwatch_event_target_arn" {
  description = "The Amazon Resource Name (ARN) associated of the target."
}

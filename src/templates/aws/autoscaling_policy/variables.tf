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
variable "autoscaling_policy_name" {
  description = "The name of the policy."
}

variable "autoscaling_policy_autoscaling_group_name" {
  description = "The name of the autoscaling group."
}

variable "autoscaling_policy_adjustment_type" {
  description = "Specifies whether the adjustment is an absolute number or a percentage of the current capacity. Valid values are ChangeInCapacity, ExactCapacity, and PercentChangeInCapacity."
}

variable "autoscaling_policy_policy_type" {
  description = "The policy type, either SimpleScaling, StepScaling or TargetTrackingScaling. If this value isn't provided, AWS will default to SimpleScaling."
}

variable "autoscaling_policy_cooldown" {
  description = "The amount of time, in seconds, after a scaling activity completes and before the next scaling activity can start."
}

variable "autoscaling_policy_scaling_adjustment" {
  description = "The number of instances by which to scale. adjustment_type determines the interpretation of this number (e.g., as an absolute number or as a percentage of the existing Auto Scaling group size). A positive increment adds to the current capacity and a negative value removes from the current capacity."
}
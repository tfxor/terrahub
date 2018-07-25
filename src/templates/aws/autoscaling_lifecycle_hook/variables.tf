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
variable "autoscaling_lifecycle_hook_name" {
  description = "The name of the lifecycle hook."
}

variable "autoscaling_lifecycle_hook_asg_name" {
  description = "The name of the Auto Scaling group to which you want to assign the lifecycle hook."
}

variable "autoscaling_lifecycle_hook_default_result" {
  description = "Defines the action the Auto Scaling group should take when the lifecycle hook timeout elapses or if an unexpected failure occurs. The value for this parameter can be either CONTINUE or ABANDON. The default value for this parameter is ABANDON."
}

variable "autoscaling_lifecycle_hook_heartbeat_timeout" {
  description = "Defines the amount of time, in seconds, that can elapse before the lifecycle hook times out."
}

variable "autoscaling_lifecycle_hook_lifecycle_transition" {
  description = "The instance state to which you want to attach the lifecycle hook. For a list of lifecycle hook types, see describe-lifecycle-hook-types"
}

variable "autoscaling_lifecycle_hook_notification_target_name" {
  description = "The Name of the notification target that Auto Scaling will use to notify you when an instance is in the transition state for the lifecycle hook."
}

variable "autoscaling_lifecycle_hook_role_name" {
  description = "The Name of the IAM role that allows the Auto Scaling group to publish to the specified notification target."
}

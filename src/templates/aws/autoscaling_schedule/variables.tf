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
variable "autoscaling_schedule_asg_name" {
  description = "The name or Amazon Resource Name (ARN) of the Auto Scaling group."
}

variable "autoscaling_schedule_name" {
  description = "The name of this scaling action."
}

variable "autoscaling_schedule_start_time" {
  description = "The time for this action to start, in YYYY-MM-DDThh:mm:ssZ format in UTC/GMT only."
}

variable "autoscaling_schedule_end_time" {
  description = "The time for this action to end, in YYYY-MM-DDThh:mm:ssZ format in UTC/GMT only."
}

variable "autoscaling_schedule_min_size" {
  description = "The minimum size for the Auto Scaling group. Default 0. Set to -1 if you don't want to change the minimum size at the scheduled time."
}

variable "autoscaling_schedule_max_size" {
  description = "The maximum size for the Auto Scaling group. Default 0. Set to -1 if you don't want to change the maximum size at the scheduled time."
}

variable "autoscaling_schedule_desired_capacity" {
  description = "The number of EC2 instances that should be running in the group. Default 0. Set to -1 if you don't want to change the desired capacity at the scheduled time."
}

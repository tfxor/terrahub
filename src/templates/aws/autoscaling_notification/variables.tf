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
variable "autoscaling_notification_group_names" {
  type        = "list"
  description = "A list of AutoScaling Group Names."
}

variable "autoscaling_notification_notifications" {
  type        = "list"
  description = "A list of Notification Types that trigger notifications. Acceptable values are documented ."
}

variable "autoscaling_notification_topic_arn" {
  description = "The Topic ARN for notifications to be sent through."
}

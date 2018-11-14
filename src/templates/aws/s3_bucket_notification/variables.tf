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
variable "aws_s3_bucket_notification_s3_bucket_name" {
  description = "The name of the bucket to put notification configuration."
  type        = "string"
}

variable "aws_s3_bucket_notification_lambda_function_name" {
  description = "Specifies Amazon Lambda function NAME."
  type        = "string"
}

variable "aws_s3_bucket_notification_events" {
  description = "Specifies event for which to send notifications."
  type        = "list"
}

variable "aws_s3_bucket_notification_filter_prefix" {
  description = "Specifies object key name prefix."
  type        = "string"
}

variable "aws_s3_bucket_notification_filter_suffix" {
  description = "Specifies object key name suffix."
  type        = "string"
}

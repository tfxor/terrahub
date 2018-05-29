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

variable "cw_log_metric_filter_name" {
  description = "A name for the metric filter."
}

variable "cw_log_metric_filter_pattern" {
  description = "A valid CloudWatch Logs filter pattern for extracting metric data out of ingested log events."
}

variable "cw_log_metric_transformation_name" {
  description = "The name of the CloudWatch metric to which the monitored log information should be published (e.g. ErrorCount)"
}

variable "cw_log_metric_transformation_namespace" {
  description = "The destination namespace of the CloudWatch metric."
}

variable "cw_log_metric_transformation_value" {
  description = "What to publish to the metric."
}

variable "cw_log_metric_filter_log_group_name" {
  description = "The name of the log group to associate the metric filter with."
}

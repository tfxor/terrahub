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
variable "aws_cloudtrail_name" {
  description = "Specifies the name of the trail."
  type        = "string"
}

variable "aws_cloudtrail_s3_bucket_name" {
  description = "Specifies the name of the S3 bucket designated for publishing log files."
  type        = "string"
}

variable "aws_cloudtrail_s3_key_prefix" {
  description = "Specifies the S3 key prefix that precedes the name of the bucket you have designated for log file delivery."
  type        = "string"
}

variable "aws_cloudtrail_include_global_service_events" {
  description = "Specifies whether the trail is publishing events from global services such as IAM to the log files."
  type        = "string"
}

variable "aws_cloudtrail_enable_logging" {
  description = "Enables logging for the trail. Defaults to true. Setting this to false will pause logging."
  type        = "string"
}

variable "aws_cloudtrail_is_multi_region_trail" {
  description = "Specifies whether the trail is created in the current region or in all regions."
  type        = "string"
}

variable "aws_cloudtrail_enable_log_file_validation" {
  description = "Specifies whether log file integrity validation is enabled."
  type        = "string"
}

variable "aws_cloudtrail_read_write_type" {
  description = "Specify if you want your trail to log read-only events, write-only events, or all. By default, the value is All. You can specify only the following value: ReadOnly, WriteOnly, All."
  type        = "string"
}

########
# tags #
########
variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

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
variable "kinesis_stream_name" {
  description = "The name of the API key."
}

variable "kinesis_stream_shard_count" {
  description = "The number of shards that the stream will use. Amazon has guidlines for specifying the Stream size that should be referenced when creating a Kinesis stream."
}

variable "kinesis_stream_retention_period" {
  description = "Length of time data records are accessible after they are added to the stream. The maximum value of a stream's retention period is 168 hours. Minimum value is 24."
}

variable "kinesis_stream_shard_level_metrics" {
  description = "A list of shard-level CloudWatch metrics which can be enabled for the stream. See Monitoring with CloudWatch for more. Note that the value ALL should not be used; instead you should provide an explicit list of metrics you wish to enable."
  type        = "list"
}

variable "kinesis_stream_encryption_type" {
  description = "The encryption type to use. The only acceptable values are NONE or KMS."
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

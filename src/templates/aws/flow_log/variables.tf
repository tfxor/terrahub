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
variable "flow_log_log_group_name" {
  description = "The name of the CloudWatch log group."
}

variable "flow_log_iam_role_arn" {
  description = "The ARN for the IAM role that's used to post flow logs to a CloudWatch Logs log group."
}

variable "flow_log_vpc_id" {
  description = "VPC ID to attach to."
}

variable "flow_log_subnet_id" {
  description = "Subnet ID to attach to."
}

variable "flow_log_eni_id" {
  description = "Elastic Network Interface ID to attach to."
}

variable "flow_log_traffic_type" {
  description = "The type of traffic to capture. Valid values: ACCEPT,REJECT, ALL"
}
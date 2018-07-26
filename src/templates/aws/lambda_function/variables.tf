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
variable "lambda_function_name" {
  description = "A unique name for your Lambda Function."
  type        = "string"
}

variable "lambda_handler" {
  description = "The function entrypoint in your code."
  type        = "string"
}

variable "lambda_runtime" {
  description = "See Runtimes for valid values."
  type        = "string"
}

variable "lambda_iam_role" {
  description = "IAM role attached to the Lambda Function."
  type        = "string"
}

variable "lambda_description" {
  description = "Description of what your Lambda Function does."
  type        = "string"
}

variable "lambda_memory_size" {
  description = "Amount of memory in MB your Lambda Function can use at runtime."
}

variable "lambda_timeout" {
  description = "The amount of time your Lambda Function has to run in seconds."
}

variable "lambda_reserved_concurrent_executions" {
  description = "The amount of reserved concurrent executions for this lambda function."
}

variable "lambda_publish" {
  description = "Whether to publish creation/change as new Lambda Function Version."
}

variable "lambda_s3_bucket" {
  description = "The S3 bucket location containing the function's deployment package."
  type        = "string"
}

variable "lambda_s3_key" {
  description = "The S3 key of an object containing the function's deployment package."
  type        = "string"
}

##############
# vpc config #
##############
variable "lambda_subnet_ids" {
  description = "A list of subnet IDs associated with the Lambda function."
  type        = "list"
}

variable "lambda_security_group_ids" {
  description = "A list of security group IDs associated with the Lambda function."
  type        = "list"
}

#########################
# environment variables #
#########################
#variable "lambda_environment_variables" {
#  description = "A map that defines environment variables for the Lambda function."
#  type        = "map"
#}

########
# tags #
########
variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

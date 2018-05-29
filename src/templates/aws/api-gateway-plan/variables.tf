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
variable "gateway_usage_plan_description" {
  description = "The description of a usage plan."
}

variable "gateway_usage_plan_product_code" {
  description = "The AWS Markeplace product identifier to associate with the usage plan as a SaaS product on AWS Marketplace."
}

variable "gateway_usage_plan_api_id" {
  description = "API Id of the associated API stage in a usage plan."
}

variable "gateway_usage_plan_stage" {
  description = "API stage name of the associated API stage in a usage plan."
}

variable "gateway_usage_plan_limit" {
  description = "The maximum number of requests that can be made in a given time period."
}

variable "gateway_usage_plan_offset" {
  description = "The number of requests subtracted from the given limit in the initial time period."
}

variable "gateway_usage_plan_period" {
  description = "The time period in which the limit applies."
}

variable "gateway_usage_plan_burst_limit" {
  description = "The API request burst limit, the maximum rate limit over a time ranging from one to a few seconds, depending upon whether the underlying token bucket is at its full capacity."
}

variable "gateway_usage_plan_rate_limit" {
  description = "The API request steady-state rate limit."
}

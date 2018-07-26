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
variable "spot_datafeed_subscription_bucket" {
  description = "The Amazon S3 bucket in which to store the Spot instance data feed."
}

variable "spot_datafeed_subscription_prefix" {
  description = "Path of folder inside bucket to place spot pricing data."
}

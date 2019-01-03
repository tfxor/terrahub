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
variable "glue_classifier_name" {
  description = "The name of the classifier."
}

variable "glue_classifier_classification" {
  description = "An identifier of the data format that the classifier matches, such as Twitter, JSON, Omniture logs, Amazon CloudWatch Logs, and so on."
}

variable "glue_classifier_custom_patterns" {
  description = "Custom grok patterns used by this classifier."
}

variable "glue_classifier_grok_pattern" {
  description = "The grok pattern used by this classifier."
}

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
variable "dynamodb_table_name" {
  description = "The name of the table, this needs to be unique within a region."
  type        = "string"
}

variable "dynamodb_read_capacity" {
  description = "The number of read units for this table."
}

variable "dynamodb_write_capacity" {
  description = "The number of write units for this table."
}

variable "dynamodb_stream_enabled" {
  description = "Indicates whether Streams are to be enabled (true) or disabled (false)."
}

############
# atribute #
############
variable "dynamodb_attribute_hash_key" {
  description = "The name of the attribute."
  type        = "string"
}

variable "dynamodb_attribute_hash_type" {
  description = "One of: S, N, or B for (S)tring, (N)umber or (B)inary data."
  type        = "string"
}

########
# tags #
########
variable "dynamodb_tag_name" {
  description = "The tag that will be applied to cloud resource."
  type        = "string"
}

variable "dynamodb_tag_description" {
  description = "The tag that will be applied to cloud resource."
  type        = "string"
}

variable "dynamodb_tag_environment" {
  description = "The tag that will be applied to cloud resource."
  type        = "string"
}

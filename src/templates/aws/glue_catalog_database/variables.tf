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
variable "glue_catalog_database_name" {
  description = "The name of the database."
}

variable "glue_catalog_database_catalog_id" {
  description = "ID of the Glue Catalog to create the database in. If omitted, this defaults to the AWS Account ID."
}

variable "glue_catalog_database_description" {
  description = "Description of the database."
}

variable "glue_catalog_database_parameters" {
  type        = "list"
  description = "A list of key-value pairs that define parameters and properties of the database."
}

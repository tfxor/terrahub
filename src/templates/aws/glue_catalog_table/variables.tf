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
variable "glue_catalog_table_name" {
  description = "Name of the table. For Hive compatibility, this must be entirely lowercase."
}

variable "glue_catalog_table_database_name" {
  description = "Name of the metadata database where the table metadata resides. For Hive compatibility, this must be all lowercase."
}

variable "glue_catalog_table_catalog_id" {
  description = "ID of the Glue Catalog and database to create the table in. If omitted, this defaults to the AWS Account ID plus the database name."
}

variable "glue_catalog_table_description" {
  description = "Description of the table."
}

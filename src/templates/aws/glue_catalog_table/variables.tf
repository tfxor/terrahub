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

variable "glue_catalog_table_partition_keys_columns" {
  type        = "list"
  description = "A list of columns by which the table is partitioned. Only primitive types are supported as partition keys."
}

variable "glue_catalog_table_type" {
  description = "The type of this table (EXTERNAL_TABLE, VIRTUAL_VIEW, etc.)."
}

variable "glue_catalog_table_parameters" {
  type        = "map"
  description = "Properties associated with this table, as a list of key-value pairs."
}

######################
# storage descriptor #
######################
variable "glue_catalog_table_storage_descriptor_columns" {
  type        = "list"
  description = "A list of the Columns in the table."
}

variable "glue_catalog_table_storage_descriptor_location" {
  description = "The physical location of the table. By default this takes the form of the warehouse location, followed by the database location in the warehouse, followed by the table name."
}

variable "glue_catalog_table_storage_descriptor_input_format" {
  description = "The input format: SequenceFileInputFormat (binary), or TextInputFormat, or a custom format."
}

variable "glue_catalog_table_storage_descriptor_output_format" {
  description = "The output format: SequenceFileOutputFormat (binary), or IgnoreKeyTextOutputFormat, or a custom format."
}

variable "glue_catalog_table_storage_descriptor_ser_de_info" {
  type        = "list"
  description = "Serialization/deserialization (SerDe) information."
}

variable "glue_catalog_table_storage_descriptor_sort_columns" {
  type        = "list"
  description = "A list of Order objects specifying the sort order of each bucket in the table."
}

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
variable "glue_crawler_database_name" {
  description = "Glue database where results are written."
}

variable "glue_crawler_name" {
  description = "Name of the crawler."
}

variable "glue_crawler_iam_role_name" {
  description = "The IAM role friendly name (including path without leading slash), or NAME of an IAM role, used by the crawler to access other resources."
}

variable "glue_crawler_description" {
  description = "Description of the crawler."
}

variable "glue_crawler_classifiers" {
  type        = "list"
  description = "List of custom classifiers. By default, all AWS classifiers are included in a crawl, but these custom classifiers always override the default classifiers for a given classification."
}

variable "glue_crawler_configuration" {
  description = "JSON string of configuration information."
}

variable "glue_crawler_schedule" {
  description = "A cron expression used to specify the schedule. For more information, see Time-Based Schedules for Jobs and Crawlers. For example, to run something every day at 12:15 UTC, you would specify: cron(15 12 * * ? *)."
}

variable "glue_crawler_table_prefix" {
  description = "The table prefix used for catalog tables that are created."
}

###############
# jdbc target #
###############
variable "glue_crawler_jdbc_target_connection_name" {
  description = "The name of the connection to use to connect to the JDBC target."
}

variable "glue_crawler_jdbc_target_path" {
  description = "The path of the JDBC target."
}

variable "glue_crawler_jdbc_target_exclusions" {
  description = "A list of glob patterns used to exclude from the crawl."
}

########################
# schema change policy #
########################
variable "glue_crawler_delete_behavior" {
  description = "The deletion behavior when the crawler finds a deleted object. Valid values: LOG, DELETE_FROM_DATABASE, or DEPRECATE_IN_DATABASE. Defaults to DEPRECATE_IN_DATABASE."
}

variable "glue_crawler_update_behavior" {
  description = "The update behavior when the crawler finds a changed schema. Valid values: LOG or UPDATE_IN_DATABASE. Defaults to UPDATE_IN_DATABASE."
}

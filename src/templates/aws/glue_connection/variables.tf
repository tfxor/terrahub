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
variable "glue_connection_name" {
  description = "The name of the connection."
}

variable "glue_connection_catalog_id" {
  description = "The ID of the Data Catalog in which to create the connection. If none is supplied, the AWS account ID is used by default."
}

variable "glue_connection_type" {
  description = "The type of the connection. Defaults to JBDC."
}

variable "glue_connection_description" {
  description = "Description of the connection."
}

#########################
# connection properties #
#########################
variable "glue_connection_properties_jdbc_connection_url" {
  description = "The url of the connection."
}

variable "glue_connection_properties_password" {
  description = "The database password of the connetion."
}

variable "glue_connection_properties_username" {
  description = "The database username of the connetion."
}

####################################
# physical connection requirements #
####################################
variable "glue_connection_availability_zone" {
  description = "The availability zone of the connection. This field is redundant and implied by subnet_id, but is currently an api requirement."
}

variable "glue_connection_security_group_id_list" {
  type        = "list"
  description = "The security group ID list used by the connection."
}

variable "glue_connection_subnet_id" {
  description = "The subnet ID used by the connection."
}

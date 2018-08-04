# Define list of variables to be used in main.tf

############
# provider #
############
variable "project" {
  description = "Project name"
}

variable "project_id" {
  description = "Project ID"
}

#############
# top level #
#############
variable "keyname" {
  description = "Metadata key name"
}

variable "keyvalue" {
  description = "Metadata key value"
}

variable "region" {
  description = "Region"
}

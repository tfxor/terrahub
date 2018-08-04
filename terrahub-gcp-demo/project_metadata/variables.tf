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

variable "region" {
  description = "Region"
}

#############
# top level #
#############
variable "name" {
  description = "Project name meta"
}

variable "owner" {
  description = "Project owner"
}

variable "org" {
  description = "Organisation"
}

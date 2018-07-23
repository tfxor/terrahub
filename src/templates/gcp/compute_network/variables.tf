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
  description = "Network name"
}

variable "auto_create_subnetworks" {
  description = "Create auto subnets"
}

variable "description" {
  description = "Network description"
}

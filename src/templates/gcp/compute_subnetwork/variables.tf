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

variable "subnet_name" {
  description = "Subnet name."
}

variable "subnet_cidr" {
  description = "Subnet CIDR."
}

variable "subnet_secondary_range_name" {
  description = "Secondary range name."
}

variable "subnet_secondary_range_cidr" {
  description = "Secondary range CIDR."
}

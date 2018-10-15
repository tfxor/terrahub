# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "_name" {
  description = "Name of the resource. The name must be 1-63 characters long, and comply with RFC1035. Specifically, the name must be 1-63 characters long and match the regular expression [a-z]([-a-z0-9]*[a-z0-9])? which means the first character must be a lowercase letter, and all following characters must be a dash, lowercase letter, or digit, except the last character, which cannot be a dash.."
}

variable "google_region" {
  description = "The Region in which the created address should reside. If it is not provided, the provider region is used."
}

variable "_description" {
  description = "An optional description of this resource."
}

variable "google_project_id" {
  description = "The ID of the project in which the resource belongs. If it is not provided, the provider project is used."
}

##########
# labels #
##########
variable "custom_labels" {
  type        = "map" 
  description = "Custom labels. A set of key/value label pairs to assign to the project."
  default     = {}
}

variable "default_labels" {
  type        = "map" 
  description = "Default labels. A set of key/value label pairs to assign to the project."
  default     = {}
}


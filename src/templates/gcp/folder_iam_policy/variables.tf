# Define list of variables to be used in main.tf

############
# provider #
############
variable "project_id" {
  description = "The ID of the project to apply any resources to. This can also be specified using any of the following environment variables (listed in order of precedence)."
}

variable "region_id" {
  description = "The region to operate under, if not specified by a given resource. This can also be specified using any of the following environment variables (listed in order of precedence)."
}
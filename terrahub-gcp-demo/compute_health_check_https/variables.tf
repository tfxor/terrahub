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
  description = "health check name"
}

variable "check_interval_sec" {
  description = "check interval"
}

variable "timeout_sec" {
  description = "check timeout"
}

variable "healthy_threshold" {
  description = "Healthy threshold"
}

variable "unhealthy_threshold" {
  description = "Unhealthy threshold"
}

variable "request_path" {
  description = "Request path"
}

variable "port" {
  description = "Request port"
}

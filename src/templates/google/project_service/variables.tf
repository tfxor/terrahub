# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_project_id" {
  description = "The project ID. If not provided, the provider project is used."
}

variable "google_project_service_name" {
  description = "The service to enable."
}

variable "google_project_disable_on_destroy" {
  description = "If true, disable the service when the terraform resource is destroyed. Defaults to true. May be useful in the event that a project is long-lived but the infrastructure running in that project changes frequently."
}

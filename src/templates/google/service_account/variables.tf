# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_service_account_display_name" {
  description = "The display name for the service account. Can be updated without creating a new resource."
}

variable "google_account_id" {
  description = "The service account ID. Changing this forces a new service account to be created."
}

variable "google_project_id" {
  description = "The ID of the project that the service account will be created in. Defaults to the provider project configuration."
}
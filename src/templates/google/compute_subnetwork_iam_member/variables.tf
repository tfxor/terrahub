# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_subnetwork" {
  description = "The name of the subnetwork."
}

variable "google_project_id" {
  description = "The project ID. If not specified, uses the ID of the project configured with the provider."
}

variable "google_project_role" {
  description = "The project ID. If not specified, uses the ID of the project configured with the provider."
}

variable "google_region" {
  description = "URL of the GCP region for this subnetwork."
}

variable "google_project_members" {
  description = "Identity that will be granted the privilege in role."
}

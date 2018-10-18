# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_project_name" {
  description = "The display name of the project."
}

variable "google_project_id" {
  description = "The project ID. Changing this forces a new project to be created."
}

variable "google_org_id" {
  description = "The numeric ID of the organization this project belongs to. Changing this forces a new project to be created. Only one of org_id or folder_id may be specified. If the org_id is specified then the project is created at the top level. Changing this forces the project to be migrated to the newly specified organization."
}

variable "google_project_folder_id" {
  description = "The numeric ID of the folder this project should be created under. Only one of org_id or folder_id may be specified. If the folder_id is specified, then the project is created under the specified folder. Changing this forces the project to be migrated to the newly specified folder."
}

variable "google_billing_account" {
  description = "The alphanumeric ID of the billing account this project belongs to. The user or service account performing this operation with Terraform must have Billing Account Administrator privileges (roles/billing.admin) in the organization. See Google Cloud Billing API Access Control for more details."
}

variable "google_project_skip_delete" {
  description = "If true, the Terraform resource can be deleted without deleting the Project via the Google API."
}

variable "google_project_auto_create_network" {
  description = "If true, the Terraform resource can be deleted without deleting the Project via the Google API."
}

variable "google_location_id" {
  description = "The location to serve the app from."
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

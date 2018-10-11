# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "compute_network_name" {
  description = "A unique name for the resource, required by GCE. Changing this forces a new resource to be created."
}

variable "compute_network_auto_create_subnetworks" {
  description = "If set to true, this network will be created in auto subnet mode, and Google will create a subnet for each region automatically. If set to false, a custom subnetted network will be created that can support google_compute_subnetwork resources."
}

variable "compute_network_routing_mode" {
  description = "Sets the network-wide routing mode for Cloud Routers to use. Accepted values are 'GLOBAL' or 'REGIONAL'."
}

variable "compute_network_description" {
  description = "A brief description of this resource."
}

variable "google_project_id" {
  description = "The project ID. If not specified, uses the ID of the project configured with the provider."
}

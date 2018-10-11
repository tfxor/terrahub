# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_compute_vpn_gateway_name" {
  description = "Name of the resource. Provided by the client when the resource is created. The name must be 1-63 characters long, and comply with RFC1035. Specifically, the name must be 1-63 characters long and match the regular expression [a-z]([-a-z0-9]*[a-z0-9])? which means the first character must be a lowercase letter, and all following characters must be a dash, lowercase letter, or digit, except the last character, which cannot be a dash."
}

variable "google_network" {
  description = "The network this VPN gateway is accepting traffic for."
}

variable "google_project_id" {
  description = "The project ID. If not specified, uses the ID of the project configured with the provider."
}

variable "google_region" {
  description = "URL of the GCP region for this subnetwork."
}

variable "google_compute_vpn_gateway_description" {
  description = "An optional description of this resource."
}

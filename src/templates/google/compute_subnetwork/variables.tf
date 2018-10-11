# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_compute_subnetwork_name" {
  description = "The name of the resource, provided by the client when initially creating the resource. The name must be 1-63 characters long, and comply with RFC1035. Specifically, the name must be 1-63 characters long and match the regular expression [a-z]([-a-z0-9]*[a-z0-9])? which means the first character must be a lowercase letter, and all following characters must be a dash, lowercase letter, or digit, except the last character, which cannot be a dash."
}

variable "google_compute_subnetwork_ip_cidr_range" {
  description = "The range of internal addresses that are owned by this subnetwork. Provide this property when you create the subnetwork. For example, 10.0.0.0/8 or 192.168.0.0/16. Ranges must be unique and non-overlapping within a network. Only IPv4 is supported."
}

variable "google_region" {
  description = "URL of the GCP region for this subnetwork."
}

variable "google_compute_subnetwork_network" {
  description = "The network this subnet belongs to. Only networks that are in the distributed mode can have subnetworks."
}

variable "google_compute_subnetwork_description" {
  description = "An optional description of this resource. Provide this property when you create the resource. This field can be set only at resource creation time."
}

variable "google_compute_subnetwork_enable_flow_logs" {
  description = "Whether the VMs in this subnet can access Google services without assigned external IP addresses."
}

variable "google_project_id" {
  description = "The project ID. If not specified, uses the ID of the project configured with the provider."
}

# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_compute_address_name" {
  description = "Name of the resource. The name must be 1-63 characters long, and comply with RFC1035. Specifically, the name must be 1-63 characters long and match the regular expression [a-z]([-a-z0-9]*[a-z0-9])? which means the first character must be a lowercase letter, and all following characters must be a dash, lowercase letter, or digit, except the last character, which cannot be a dash.."
}

variable "google_subnetwork" {
  description = "The URL of the subnetwork in which to reserve the address. If an IP address is specified, it must be within the subnetwork's IP range. This field can only be used with INTERNAL type with GCE_ENDPOINT/DNS_RESOLVER purposes."
}

variable "google_compute_address_type" {
  description = "The type of address to reserve, either INTERNAL or EXTERNAL. If unspecified, defaults to EXTERNAL."
}

variable "google_compute_address_ip" {
  description = "The static external IP address represented by this resource. Only IPv4 is supported. An address may only be specified for INTERNAL address types. The IP address must be inside the specified subnetwork, if any."
}

variable "google_region" {
  description = "The Region in which the created address should reside. If it is not provided, the provider region is used."
}

variable "google_compute_address_description" {
  description = "An optional description of this resource."
}

variable "google_compute_address_network_tier" {
  description = "The networking tier used for configuring this address. This field can take the following values: PREMIUM or STANDARD. If this field is not specified, it is assumed to be PREMIUM."
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

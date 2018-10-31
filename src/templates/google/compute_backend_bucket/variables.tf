# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_compute_backend_bucket_resource_name" {
  description = "Name of the resource. Provided by the client when the resource is created. The name must be 1-63 characters long, and comply with RFC1035. Specifically, the name must be 1-63 characters long and match the regular expression [a-z]([-a-z0-9]*[a-z0-9])? which means the first character must be a lowercase letter, and all following characters must be a dash, lowercase letter, or digit, except the last character, which cannot be a dash."
}

variable "google_compute_backend_bucket_description" {
  description = "An optional description of this resource."
}

variable "google_compute_backend_bucket_name" {
  description = "Cloud Storage bucket name."
}

variable "google_compute_backend_bucket_enable_cdn" {
  description = "If true, enable Cloud CDN for this BackendBucket."
}

variable "google_project_id" {
  description = "The ID of the project in which the resource belongs. If it is not provided, the provider project is used."
}

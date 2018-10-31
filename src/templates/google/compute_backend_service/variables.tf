# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_compute_backend_service_name" {
  description = "The name of the backend service."
}

variable "google_compute_backend_service_description" {
  description = "Textual description for the backend."
}

variable "google_compute_backend_service_port_name" {
  description = "The name of a service that has been added to an instance group in this backend. See related docs for details. Defaults to http."
}

variable "google_compute_backend_service_protocol" {
  description = "The protocol for incoming requests. Defaults to HTTP."
}

variable "google_compute_backend_service_timeout_sec" {
  description = "The number of secs to wait for a backend to respond to a request before considering the request failed. Defaults to 30."
}

variable "google_compute_backend_service_enable_cdn" {
  description = "Whether or not to enable the Cloud CDN on the backend service."
}

variable "google_compute_backend_service_enable_cdn" {
  description = "Whether or not to enable the Cloud CDN on the backend service."
}

variable "google_project_id" {
  description = "The ID of the project in which the resource belongs. If it is not provided, the provider project is used."
}

variable "google_compute_backend_service_backend_group" {
  description = "The name or URI of a Compute Engine instance group (google_compute_instance_group_manager.xyz.instance_group) that can receive traffic."
}

variable "google_compute_backend_service_health_checks" {
  description = "Specifies a list of HTTP/HTTPS health checks for checking the health of the backend service. Currently at most one health check can be specified, and a health check is required."
}

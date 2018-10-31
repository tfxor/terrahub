# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_storage_bucket_name" {
  description = "The name of the bucket."
}

variable "google_storage_bucket_location" {
  description = "The GCS location."
}

variable "google_project_id" {
  description = "The ID of the project in which the resource belongs. If it is not provided, the provider project is used."
}

variable "google_storage_bucket_force_destroy" {
  description = "When deleting a bucket, this boolean option will delete all contained objects. If you try to delete a bucket that contains objects, Terraform will fail that run."
}

########
# cors #
########
variable "google_storage_bucket_cors_origin" {
  type        = "list"
  description = "The list of Origins eligible to receive CORS response headers. Note: '*' is permitted in the list of origins, and means 'any Origin'."
}

variable "google_storage_bucket_cors_method" {
  type        = "list"
  description = "The list of HTTP methods on which to include CORS response headers, (GET, OPTIONS, POST, etc) Note: '*' is permitted in the list of methods, and means 'any method'."
}

variable "google_storage_bucket_cors_response_header" {
  type        = "list"
  description = "The list of HTTP headers other than the simple response headers to give permission for the user-agent to share across domains."
}

variable "google_storage_bucket_cors_max_age_seconds" {
  description = "The value, in seconds, to return in the Access-Control-Max-Age header used in preflight responses."
}

##############
# versioning #
##############
variable "google_storage_bucket_versioning_enabled" {
  description = "While set to true, versioning is fully enabled for this bucket."
}

###########
# website #
###########
variable "google_storage_website_index_document" {
  description = " Behaves as the bucket's directory index where missing objects are treated as potential directories."
}

variable "google_storage_website_error_document" {
  description = "The custom object to return when a requested resource is not found."
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

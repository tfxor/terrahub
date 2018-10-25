# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_storage_bucket_name" {
  description = "The name of the bucket it applies to."
}

variable "google_storage_bucket_role_entity" {
  type        = "list"
  description = "List of role/entity pairs in the form ROLE:entity. See GCS Bucket ACL documentation for more details. Must be set if predefined_acl is not."
}

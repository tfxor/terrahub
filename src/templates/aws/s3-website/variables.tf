# Define list of variables to be used in main.tf

############
# provider #
############
variable "account_id" {
  description = "Allowed AWS account ID, to prevent you from mistakenly using an incorrect one (and potentially end up destroying a live environment)."
}

variable "region" {
  description = "This is the AWS region."
}

#############
# top level #
#############
variable "s3_bucket_name" {
  description = "The name of the bucket."
  type        = "string"
}

variable "s3_bucket_acl" {
  description = "The canned ACL to apply."
  type        = "string"
}

variable "s3_bucket_region" {
  description = "The AWS region this bucket should reside in."
  type        = "string"
}

variable "s3_bucket_force_destroy" {
  description = "A boolean that indicates all objects should be deleted from the bucket so that the bucket can be destroyed without error."
  type        = "string"
}

#############
# cors rule #
#############
variable "s3_bucket_cors_rule_allowed_headers" {
  description = "Specifies which headers are allowed."
  type        = "list"
}

variable "s3_bucket_cors_rule_allowed_methods" {
  description = "Specifies which methods are allowed. Can be GET, PUT, POST, DELETE or HEAD."
  type        = "list"
}

variable "s3_bucket_cors_rule_allowed_origins" {
  description = "Specifies which origins are allowed."
  type        = "list"
}

variable "s3_bucket_cors_rule_expose_headers" {
  description = "Specifies which origins are allowed."
  type        = "list"
}

variable "s3_bucket_cors_rule_max_age_seconds" {
  description = "Specifies time in seconds that browser can cache the response for a preflight request."
}

##############
# versioning #
##############
variable "s3_bucket_versioning_enabled" {
  description = "Enable versioning. Once you version-enable a bucket, it can never return to an unversioned state. You can, however, suspend versioning on that bucket."
}

variable "s3_bucket_versioning_mfa_delete" {
  description = "Enable MFA delete for either Change the versioning state of your bucket or Permanently delete an object version."
}

###########
# website #
###########
variable "s3_bucket_website_index_document" {
  description = "Amazon S3 returns this index document when requests are made to the root domain or any of the subfolders."
}

variable "s3_bucket_website_error_document" {
  description = "An absolute path to the document to return in case of a 4XX error."
}

########
# tags #
########
variable "s3_bucket_tag_name" {
  description = "The tag that will be applied to cloud resource."
  type        = "string"
}

variable "s3_bucket_tag_description" {
  description = "The tag that will be applied to cloud resource."
  type        = "string"
}

variable "s3_bucket_tag_environment" {
  description = "The tag that will be applied to cloud resource."
  type        = "string"
}

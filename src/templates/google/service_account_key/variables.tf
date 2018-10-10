# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_account_id" {
  description = "The Service account id of the Key Pair. This can be a string in the format {ACCOUNT} or projects/{PROJECT_ID}/serviceAccounts/{ACCOUNT}, where {ACCOUNT} is the email address or unique id of the service account. If the {ACCOUNT} syntax is used, the project will be inferred from the account."
}

variable "google_project_id" {
  description = "The project ID. Changing this forces a new project to be created."
}

variable "google_service_account_key_algorithm" {
  description = "The algorithm used to generate the key. KEY_ALG_RSA_2048 is the default algorithm. Valid values are listed at ServiceAccountPrivateKeyType (only used on create)"
}

variable "google_service_account_key_public_key_type" {
  description = "The output format of the public key requested. X509_PEM is the default output format."
}

variable "google_service_account_key_private_key_type" {
  description = "The output format of the private key. TYPE_GOOGLE_CREDENTIALS_FILE is the default output format."
}
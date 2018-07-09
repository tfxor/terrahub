# Define list of variables to be used in main.tf

################
# backend data #
################
variable "backend_region" {
  description = "AWS region where terraform.tfstate is stored"
  type        = "string"
  default     = "us-east-1"
}

variable "backend_bucket" {
  description = "S3 bucket where terraform.tfstate is stored"
  type        = "string"
  default     = "data-lake-terrahub-us-east-1"
}

variable "backend_key" {
  description = "S3 key where terraform.tfstate is stored"
  type        = "string"
  default     = "terraform.tfstate"
}

variable "backend_encrypt" {
  description = "Encryption flag (true or false)"
  type        = "string"
  default     = "false"
}

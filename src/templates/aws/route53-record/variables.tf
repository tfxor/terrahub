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
variable "route53_record_zone_id" {
  description = "The ID of the hosted zone to contain this record."
}

variable "route53_record_name" {
  description = "The name of the record."
}

variable "route53_record_type" {
  description = "The record type. Valid values are A, AAAA, CAA, CNAME, MX, NAPTR, NS, PTR, SOA, SPF, SRV and TXT."
}

variable "route53_record_ttl" {
  description = "The TTL of the record."
}

variable "route53_record_records" {
  description = "A string list of records. To specify a single record value longer than 255 characters such as a TXT record for DKIM."
  type        = "list"
}

variable "route53_record_allow_overwrite" {
  description = "Allow creation of this record in Terraform to overwrite an existing record, if any."
}

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
variable "aws_es_domain_name" {
  description = "Elastic Search Service cluster name."
}

variable "aws_es_domain_version" {
  description = "Elastic Search Service cluster version number."
}

###################
# encrypt at rest #
###################
variable "aws_es_domain_encryption_enabled" {
  description = "Enable encription in Elastic Search."
}

variable "aws_es_domain_encryption_kms_key_id" {
  description = "Enable encription in Elastic Search."
}

##################
# cluster config #
##################
variable "aws_es_domain_itype" {
  description = "Elastic Search Service cluster Ec2 instance type."
}

variable "aws_es_domain_icount" {
  description = "Elastic Search Service cluster Ec2 instance number."
}

variable "aws_es_domain_dedicated_master" {
  description = "Indicates whether our cluster have dedicated master nodes enabled."
}

variable "aws_es_domain_mtype" {
  description = "Elastic Search Service cluster dedicated master Ec2 instance type."
}

variable "aws_es_domain_mcount" {
  description = "Elastic Search Service cluster dedicated master Ec2 instance number."
}

variable "aws_es_domain_zone_awareness" {
  description = "Indicates whether zone awareness is enabled."
}

###############
# vpc options #
###############
variable "aws_es_domain_security_group_ids" {
  description = "List of VPC Security group IDs for the Elastic Search Service EndPoints will be created."
  type        = "list"
  default     = []
}

variable "aws_es_domain_subnet_ids" {
  description = "List of VPC Subnet IDs for the Elastic Search Service EndPoints will be created."
  type        = "list"
  default     = []
}

####################
# advanced options #
####################
variable "aws_es_domain_rest_action_multi_allow_explicit_index" {
  description = "Specifies whether explicit references to indices are allowed inside the body of HTTP requests."
}

variable "aws_es_domain_indices_fielddata_cache_size" {
  description = "Percentage of Java heap space allocated to field data."
}

variable "aws_es_domain_indices_query_bool_max_clause_count" {
  description = "Maximum number of clauses allowed in a Lucene boolean query."
}

###############
# ebs options #
###############
variable "aws_es_domain_ebs_enabled" {
  description = "Enable EBS volumes."
}

variable "aws_es_domain_volume_type" {
  description = "Default type of the EBS volumes."
}

variable "aws_es_domain_volume_size" {
  description = "Default size of the EBS volumes."
}

####################
# snapshot options #
####################
variable "aws_es_domain_snapshot_start" {
  description = "Elastic Search Service maintenance/snapshot start time."
}

########
# tags #
########
variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

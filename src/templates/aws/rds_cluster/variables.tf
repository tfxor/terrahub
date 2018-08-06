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
variable "rds_cluster_identifier" {
  description = "The cluster identifier. If omitted, Terraform will assign a random, unique identifier."
}

variable "rds_cluster_engine" {
  description = "The name of the database engine to be used for this DB cluster. Defaults to aurora. Valid Values: aurora, aurora-mysql, aurora-postgresql"
}

variable "rds_cluster_availability_zones" {
  type        = "list"
  description = "A list of EC2 Availability Zones that instances in the DB cluster can be created in."
}

variable "rds_cluster_database_name" {
  description = "Name for an automatically created database on cluster creation. There are different naming restrictions per database engine: RDS Naming Constraints."
}

variable "rds_cluster_master_username" {
  description = "Username for the master DB user. Please refer to the RDS Naming Constraints."
}

variable "rds_cluster_master_password" {
  description = "Password for the master DB user. Note that this may show up in logs, and it will be stored in the state file. Please refer to the RDS Naming Constraints."
}

variable "rds_cluster_backup_retention_period" {
  description = "The days to retain backups for."
}

variable "rds_cluster_preferred_backup_window" {
  description = "The daily time range during which automated backups are created if automated backups are enabled using the BackupRetentionPeriod parameter."
}

variable "rds_cluster_skip_final_snapshot" {
  description = "Determines whether a final DB snapshot is created before the DB cluster is deleted. If true is specified, no DB snapshot is created. If false is specified, a DB snapshot is created before the DB cluster is deleted, using the value from final_snapshot_identifier."
}

variable "rds_cluster_backtrack_window" {
  description = "The target backtrack window, in seconds. Only available for aurora engine currently. "
}

variable "rds_cluster_storage_encrypted" {
  description = "Specifies whether the DB cluster is encrypted."
}

variable "rds_cluster_apply_immediately" {
  description = "Specifies whether any cluster modifications are applied immediately, or during the next maintenance window."
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

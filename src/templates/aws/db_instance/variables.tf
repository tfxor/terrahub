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
variable "db_instance_license_model" {
  description = "License model information for this DB instance."
}

variable "db_instance_engine" {
  description = "The database engine to use. For supported values, see the Engine parameter in API action CreateDBInstance. Note that for Amazon Aurora instances the engine must match the DB cluster's engine'. For information on the difference between the available Aurora MySQL engines see Comparison between Aurora MySQL 1 and Aurora MySQL 2 in the Amazon RDS User Guide."
}

variable "db_instance_engine_version" {
  description = "The engine version to use. If auto_minor_version_upgrade is enabled, you can provide a prefix of the version such as 5.7 (for 5.7.10) and this attribute will ignore differences in the patch version automatically (e.g. 5.7.17). For supported values, see the EngineVersion parameter in API action CreateDBInstance. Note that for Amazon Aurora instances the engine version must match the DB cluster's engine version'."
}

variable "db_instance_instance_class" {
  description = "The instance type of the RDS instance."
}

variable "db_instance_storage_type" {
  description = "The type of storage."
}

variable "db_instance_iops" {
  description = "The amount of provisioned IOPS."
}

variable "db_instance_allocated_storage" {
  description = "The allocated storage in gibibytes."
}

variable "db_instance_identifier" {
  description = "The name of the RDS instance, if omitted, Terraform will assign a random, unique identifier."
}

variable "db_instance_name" {
  description = "The name of the database to create when the DB instance is created. If this parameter is not specified, no database is created in the DB instance. Note that this does not apply for Oracle or SQL Server engines. See the AWS documentation for more details on what applies for those engines."
}

variable "db_instance_username" {
  description = "Username for the master DB user."
}

variable "db_instance_password" {
  description = "Password for the master DB user. Note that this may show up in logs, and it will be stored in the state file."
}

variable "db_instance_port" {
  description = "The port on which the DB accepts connections."
}

variable "db_instance_storage_encrypted" {
  description = "Specifies whether the DB instance is encrypted. Note that if you are creating a cross-region read replica this field is ignored and you should instead declare kms_key_id with a valid ARN. The default is false if not specified."
}

variable "db_instance_character_set_name" {
  description = "The character set name to use for DB encoding in Oracle instances. This can't be changed."
}

variable "db_instance_vpc_security_group_ids" {
  type        = "list"
  description = "List of VPC security groups to associate."
}

variable "db_instance_multi_az" {
  description = "Specifies if the RDS instance is multi-AZ."
}

variable "db_instance_auto_minor_version_upgrade" {
  description = "Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window."
}

variable "db_instance_maintenance_window" {
  description = "The window to perform maintenance in."
}

variable "db_instance_copy_tags_to_snapshot" {
  description = "On delete, copy all Instance tags to the final snapshot (if final_snapshot_identifier is specified)."
}

variable "db_instance_backup_retention_period" {
  description = "The days to retain backups for. Must be 1 or greater to be a source for a Read Replica."
}

variable "db_instance_backup_window" {
  description = "The daily time range (in UTC) during which automated backups are created if they are enabled."
}

variable "db_instance_monitoring_interval" {
  description = "The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance. To disable collecting Enhanced Monitoring metrics, specify 0. The default is 0. Valid Values: 0, 1, 5, 10, 15, 30, 60."
}

variable "db_instance_db_subnet_group_name" {
  description = "Name of DB subnet group. DB instance will be created in the VPC associated with the DB subnet group. If unspecified, will be created in the default VPC, or in EC2 Classic, if available. When working with read replicas, it needs to be specified only if the source database specifies an instance in another AWS Region."
}

variable "db_instance_skip_final_snapshot" {
  description = "Determines whether a final DB snapshot is created before the DB instance is deleted. If true is specified, no DBSnapshot is created. If false is specified, a DB snapshot is created before the DB instance is deleted, using the value from final_snapshot_identifier."
}

variable "db_instance_apply_immediately" {
  description = "Specifies whether any database modifications are applied immediately, or during the next maintenance window."
}

variable "db_instance_availability_zone" {
  description = "The AZ for the RDS instance."
}

variable "db_instance_publicly_accessible" {
  description = "Bool to control if instance is publicly accessible."
}

variable "db_instance_option_group_name" {
  description = "Name of the DB option group to associate."
}

variable "db_instance_parameter_group_name" {
  description = "Name of the DB parameter group to associate."
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

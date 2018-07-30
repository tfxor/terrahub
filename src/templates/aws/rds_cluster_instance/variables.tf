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
variable "rds_cluster_instance_count" {
  description = "The count of cluster instance."
}

variable "rds_cluster_instance_engine" {
  description = "The name of the database engine to be used for the RDS instance. Defaults to aurora. Valid Values: aurora, aurora-mysql, aurora-postgresql."
}

variable "rds_cluster_instance_identifier" {
  description = "The indentifier for the RDS instance, if omitted, Terraform will assign a random, unique identifier."
}

variable "rds_cluster_instance_cluster_identifier" {
  description = "The identifier of the aws_rds_cluster in which to launch this instance."
}

variable "rds_cluster_instance_instance_class" {
  description = "The instance class to use. For details on CPU and memory, see Scaling Aurora DB Instances. Aurora currently supports the below instance classes."
}

variable "rds_cluster_instance_publicly_accessible" {
  description = "Bool to control if instance is publicly accessible. Default false. See the documentation on Creating DB Instances for more details on controlling this property."
}

variable "rds_cluster_instance_db_subnet_group_name" {
  description = "(Required if publicly_accessible = false, Optional otherwise) A DB subnet group to associate with this DB instance. NOTE: This must match the db_subnet_group_name of the attached aws_rds_cluster."
}

variable "rds_cluster_instance_apply_immediately" {
  description = "Specifies whether any database modifications are applied immediately, or during the next maintenance window."
}

variable "rds_cluster_instance_monitoring_interval" {
  description = "The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance. To disable collecting Enhanced Monitoring metrics, specify 0."
}

variable "rds_cluster_instance_promotion_tier" {
  description = "Failover Priority setting on instance level. The reader who has lower tier has higher priority to get promoter to writer."
}

variable "rds_cluster_instance_availability_zone" {
  description = "The EC2 Availability Zone that the DB instance is created in. See docs about the details."
}

variable "rds_cluster_instance_preferred_backup_window" {
  description = "The daily time range during which automated backups are created if automated backups are enabled."
}

variable "rds_cluster_instance_preferred_maintenance_window" {
  description = "The window to perform maintenance in."
}

variable "rds_cluster_instance_auto_minor_version_upgrade" {
  description = "Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window."
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

# aws_rds_cluster_instance

Provides an RDS Cluster Resource Instance. A Cluster Instance Resource defines attributes that are specific to a single instance in a RDS Cluster, specifically running Amazon Aurora.

Unlike other RDS resources that support replication, with Amazon Aurora you do not designate a primary and subsequent replicas. Instead, you simply add RDS Instances and Aurora manages the replication. You can use the count meta-parameter to make multiple instances and join them all to the same RDS Cluster, or you may specify different Cluster Instance resources with various instance_class sizes.

For more information on Amazon Aurora, see Aurora on Amazon RDS in the Amazon RDS User Guide.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|rds_cluster_instance_count|The count of cluster instance.|string|2|No|
|rds_cluster_instance_engine|The name of the database engine to be used for the RDS instance. Defaults to aurora. Valid Values: aurora, aurora-mysql, aurora-postgresql.|string|aurora|No|
|rds_cluster_instance_identifier|The indentifier for the RDS instance, if omitted, Terraform will assign a random, unique identifier.|string|{{ name }}|No|
|rds_cluster_instance_cluster_identifier|The identifier of the aws_rds_cluster in which to launch this instance.|string||Yes|
|rds_cluster_instance_instance_class|The instance class to use. For details on CPU and memory, see Scaling Aurora DB Instances. Aurora currently supports the below instance classes.|string|db.t2.small|No|
|rds_cluster_instance_publicly_accessible|Bool to control if instance is publicly accessible. Default false. See the documentation on Creating DB Instances for more details on controlling this property.|boolean|false|No|
|rds_cluster_instance_db_subnet_group_name|(Required if publicly_accessible = false, Optional otherwise) A DB subnet group to associate with this DB instance. NOTE: This must match the db_subnet_group_name of the attached aws_rds_cluster.|string||Yes|
|rds_cluster_instance_apply_immediately|Specifies whether any database modifications are applied immediately, or during the next maintenance window.|boolean|false|No|
|rds_cluster_instance_monitoring_interval|The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance. To disable collecting Enhanced Monitoring metrics, specify 0.|number|0|No|
|rds_cluster_instance_promotion_tier|Failover Priority setting on instance level. The reader who has lower tier has higher priority to get promoter to writer.|number|0|No|
|rds_cluster_instance_availability_zone|The EC2 Availability Zone that the DB instance is created in. See docs about the details.|string|us-east-1a|No|
|rds_cluster_instance_preferred_backup_window|The daily time range during which automated backups are created if automated backups are enabled.|string|04:00-09:00|No|
|rds_cluster_instance_preferred_maintenance_window|The window to perform maintenance in.|string|Mon:00:00-Mon:03:00|No|
|rds_cluster_instance_auto_minor_version_upgrade|Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window.|boolean|true|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|arn|Amazon Resource Name (ARN) of cluster instance|string|
|cluster_identifier|The RDS Cluster Identifier|string|
|identifier|The Instance identifier|string|
|id|The Instance identifier.|string|
|thub_id|The Instance identifier (hotfix for issue hashicorp/terraform#[7982]).|string|
|writer|Boolean indicating if this instance is writable. False indicates this instance is a read replica.|string|
|allocated_storage|The amount of allocated storage|string|
|availability_zone|The availability zone of the instance|string|
|endpoint|The DNS address for this instance. May not be writable|string|
|engine|The database engine|string|
|engine_version|The database engine version|string|
|database_name|The database name|string|
|port|The database port|string|
|status|The RDS instance status|string|
|storage_encrypted|Specifies whether the DB cluster is encrypted.|string|
|kms_key_id|The ARN for the KMS encryption key if one is set to the cluster.|string|
|dbi_resource_id|The region-unique, immutable identifier for the DB instance.|string|
|performance_insights_enabled|Specifies whether Performance Insights is enabled or not.|string|
|performance_insights_kms_key_id|The ARN for the KMS encryption key used by Performance Insights.|string|
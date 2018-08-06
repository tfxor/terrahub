# aws_db_instance

Provides an RDS instance resource. A DB instance is an isolated database environment in the cloud. A DB instance can contain multiple user-created databases.

Changes to a DB instance can occur when you manually change a parameter, such as allocated_storage, and are reflected in the next maintenance window. Because of this, Terraform may report a difference in its planning phase because a modification has not yet taken place. You can use the apply_immediately flag to instruct the service to apply the change immediately (see documentation below).

When upgrading the major version of an engine, allow_major_version_upgrade must be set to true.

Note: using apply_immediately can result in a brief downtime as the server reboots. See the AWS Docs on RDS Maintenance for more information.

Note: All arguments including the username and password will be stored in the raw state as plain-text. Read more about sensitive data in state.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|db_instance_license_model|License model information for this DB instance.|string|bring-your-own-license|No|
|db_instance_engine|The database engine to use. For supported values, see the Engine parameter in API action CreateDBInstance. Note that for Amazon Aurora instances the engine must match the DB cluster's engine'. For information on the difference between the available Aurora MySQL engines see Comparison between Aurora MySQL 1 and Aurora MySQL 2 in the Amazon RDS User Guide.|string|oracle-ee|No|
|db_instance_engine_version|The engine version to use. If auto_minor_version_upgrade is enabled, you can provide a prefix of the version such as 5.7 (for 5.7.10) and this attribute will ignore differences in the patch version automatically (e.g. 5.7.17). For supported values, see the EngineVersion parameter in API action CreateDBInstance. Note that for Amazon Aurora instances the engine version must match the DB cluster's engine version'.|string|12.1.0.2.v11|No|
|db_instance_instance_class|The instance type of the RDS instance.|string|db.t2.micro|No|
|db_instance_storage_type|The type of storage.|string|io1|No|
|db_instance_iops|The amount of provisioned IOPS.|number|1000|No|
|db_instance_allocated_storage|The allocated storage in gibibytes.|number|100|No|
|db_instance_identifier|The name of the RDS instance, if omitted, Terraform will assign a random, unique identifier.|string|oracle _ {{ name }}|No|
|db_instance_name|The name of the database to create when the DB instance is created. If this parameter is not specified, no database is created in the DB instance. Note that this does not apply for Oracle or SQL Server engines. See the AWS documentation for more details on what applies for those engines.|string|oracle _ {{ name }} _ db|No|
|db_instance_username|Username for the master DB user.|string|root|No|
|db_instance_password|Password for the master DB user. Note that this may show up in logs, and it will be stored in the state file.|string|root!root|No|
|db_instance_port|The port on which the DB accepts connections.|string|1521|No|
|db_instance_storage_encrypted|Specifies whether the DB instance is encrypted. Note that if you are creating a cross-region read replica this field is ignored and you should instead declare kms_key_id with a valid ARN. The default is false if not specified.|boolean|false|No|
|db_instance_character_set_name|The character set name to use for DB encoding in Oracle instances. This can't be changed.|string|AL32UTF8|No|
|db_instance_vpc_security_group_ids|List of VPC security groups to associate.|list||Yes|
|db_instance_multi_az|Specifies if the RDS instance is multi-AZ.|boolean|false|No|
|db_instance_auto_minor_version_upgrade|Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window.|boolean|true|No|
|db_instance_maintenance_window|The window to perform maintenance in.|string|Sun:01:00-Sun:01:30|No|
|db_instance_copy_tags_to_snapshot|On delete, copy all Instance tags to the final snapshot (if final_snapshot_identifier is specified).|boolean|false|No|
|db_instance_backup_retention_period|The days to retain backups for. Must be 1 or greater to be a source for a Read Replica.|number|7|No|
|db_instance_backup_window|The daily time range (in UTC) during which automated backups are created if they are enabled.|string|00:00-00:30|No|
|db_instance_monitoring_interval|The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance. To disable collecting Enhanced Monitoring metrics, specify 0. The default is 0. Valid Values: 0, 1, 5, 10, 15, 30, 60.|string|0|No|
|db_instance_db_subnet_group_name|Name of DB subnet group. DB instance will be created in the VPC associated with the DB subnet group. If unspecified, will be created in the default VPC, or in EC2 Classic, if available. When working with read replicas, it needs to be specified only if the source database specifies an instance in another AWS Region.|string||Yes|
|db_instance_skip_final_snapshot|Determines whether a final DB snapshot is created before the DB instance is deleted. If true is specified, no DBSnapshot is created. If false is specified, a DB snapshot is created before the DB instance is deleted, using the value from final_snapshot_identifier.|boolean|false|No|
|db_instance_apply_immediately|Specifies whether any database modifications are applied immediately, or during the next maintenance window.|boolean|false|No|
|db_instance_availability_zone|The AZ for the RDS instance.|boolean|us-east-2|No|
|db_instance_publicly_accessible|Bool to control if instance is publicly accessible.|boolean|false|No|
|db_instance_option_group_name|Name of the DB option group to associate.|string||Yes|
|db_instance_parameter_group_name|Name of the DB parameter group to associate.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|address|The address of the RDS instance.|string|
|arn|The ARN of the RDS instance.|string|
|allocated_storage|The amount of allocated storage.|string|
|availability_zone|The availability zone of the instance.|string|
|backup_retention_period|The backup retention period.|string|
|backup_window|The backup window.|string|
|ca_cert_identifier|Specifies the identifier of the CA certificate for the DB instance.|string|
|endpoint|The connection endpoint.|string|
|engine|The database engine.|string|
|engine_version|The database engine version.|string|
|hosted_zone_id|The canonical hosted zone ID of the DB instance (to be used in a Route 53 Alias record).|string|
|id|The RDS instance ID.|string|
|thub_id|The RDS instance ID.|string|
|instance_class|The RDS instance class.|string|
|maintenance_window|The instance maintenance window.|string|
|multi_az|If the RDS instance is multi AZ enabled.|string|
|name|The database name.|string|
|port|The database port.|string|
|resource_id|The RDS Resource ID of this instance.|string|
|status|The RDS instance status.|string|
|storage_encrypted|Specifies whether the DB instance is encrypted.|string|
|username|The master username for the database.|string|
|character_set_name|The character set used on Oracle instances.|string|

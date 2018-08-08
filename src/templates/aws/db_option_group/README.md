# aws_db_option_group

Provides an RDS DB option group resource. Documentation of the available options for various RDS engines can be found at: * MariaDB Options * Microsoft SQL Server Options * MySQL Options * Oracle Options

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|

|db_option_group_name|The name of the option group. If omitted, Terraform will assign a random, unique name. Must be lowercase, to match as it is stored in AWS.|string|{{ name }}|No|
|db_option_group_description|The description of the option group.|string|Managed by TerraHub|No|
|db_option_group_engine_name|Specifies the name of the engine that this option group should be associated with.|string|oracle-ee|No|
|db_option_group_major_engine_version|Specifies the major version of the engine that this option group should be associated with.|string|11|No|
|db_option_group_option_name|The Name of the Option (e.g. MEMCACHED).|string||Yes|
|db_option_group_setting_name|The Name of the setting.|string||Yes|
|db_option_group_setting_value|The Value of the setting.|string||Yes|
|db_option_group_port|The Port number when connecting to the Option (e.g. 11211).|number||Yes|
|db_option_group_version|The version of the option (e.g. 13.1.0.0).|string||Yes|
|db_option_group_db_security_group_memberships|A list of DB Security Groups for which the option is enabled.|list||Yes|
|db_option_group_vpc_security_group_memberships|A list of VPC Security Groups for which the option is enabled.|list||Yes|

|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The db option group name.|string|
|thub_id|The db option group name (hotfix for issue hashicorp/terraform#[7982]).|string|
|arn|The ARN of the db option group.|string|

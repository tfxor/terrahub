# aws_db_parameter_group

Provides an RDS DB parameter group resource .Documentation of the available parameters for various RDS engines can be found at: * Aurora MySQL Parameters * Aurora PostgreSQL Parameters * MariaDB Parameters * Oracle Parameters * PostgreSQL Parameters

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|db_parameter_group_name|The name of the DB parameter group. If omitted, Terraform will assign a random, unique name.|string|{{ name }}|No|
|db_parameter_group_family|The family of the DB parameter group.|string|mysql5.6|No|
|db_parameter_group_description|The description of the DB parameter group.|string|Managed by TerraHub|No|
|db_parameter_group_parameter_name|The name of the DB parameter.|string|character_set_server|No|
|db_parameter_group_parameter_value|The value of the DB parameter.|string|utf8|No|
|db_parameter_group_parameter_apply_method|immediate or pending-reboot. Some engines can't apply some parameters without a reboot, and you will need to specify pending-reboot here.|string|immediate|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The db parameter group name.|string|
|thub_id|The db parameter group name (matches name; hotfix for issue hashicorp/terraform#[7982]).|string|
|arn|The ARN of the db parameter group.|string|

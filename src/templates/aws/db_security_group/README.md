# aws_db_security_group

Provides an RDS security group resource. This is only for DB instances in the EC2-Classic Platform. For instances inside a VPC, use the aws_db_instance.vpc_security_group_ids attribute instead.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|db_security_group_name|The name of the DB security group.|string|{{ name }}|No|
|db_security_group_description|The description of the DB security group.|string|Managed by TerraHub|No|
|db_security_group_ingress_sg_name|The name of the security group to authorize.|string|{{ name }}|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The db security group ID.|string|
|thub_id|The db security group ID.|string|
|arn|The arn of the DB security group.|string|
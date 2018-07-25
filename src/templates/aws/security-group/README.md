# aws_security_group

Provides a security group resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|security_group_name|The name of the security group.|string|{{ name }}|No|
|security_group_description|The security group description.|string|{{ name }} - Managed by TerraHub|No|
|security_group_vpc_id|The VPC ID.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|sg_id|The ID of the security group.|string|
|arn|The ARN of the security group.|string|
|vpc_id|The VPC ID.|string|
|owner_id|The owner ID.|string|
|name|The name of the security group.|string|
|description|The description of the security group.|string|
|ingress|The ingress rules. See above for more.|string|
|egress|The egress rules. See above for more.|string|

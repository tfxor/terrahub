# aws_internet_gateway

Provides a resource to create a VPC Internet Gateway.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|internet_gateway_vpc_id|The VPC ID to create in.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the Internet Gateway.|string|
|thub_id|The ID of the Internet Gateway (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|

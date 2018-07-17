# subnet

Provides an VPC subnet resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|subnet_aws_vpc_id|The VPC ID.|string||Yes|
|subnet_availability_zone|The AZ for the subnet.|string|us-east-1a|No|
|subnet_cidr_block|The CIDR block for the subnet.|string|10.0.1.0/24|No|
|subnet_map_public_ip_on_launch|Specify true to indicate that instances launched into the subnet should be assigned a public IP address.|boolean|false|No|
|subnet_assign_ipv6_address_on_creation|Specify true to indicate that network interfaces created in the specified subnet should be assigned an IPv6 address.|boolean|false|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|subnet_id|The ID of the subnet.|string|
|subnet_availability_zone|The AZ for the subnet.|string|
|subnet_cidr_block|The CIDR block for the subnet.|string|
|subnet_vpc_id|The VPC ID.|string|

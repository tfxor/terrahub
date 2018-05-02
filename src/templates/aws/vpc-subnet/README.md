# subnet

Provides an VPC subnet resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|subnet_aws_vpc_id|The VPC ID.|string||Yes|
|subnet_availability_zone|The AZ for the subnet.|string|us-east-1a|No|
|subnet_cidr_block|The CIDR block for the subnet.|string|10.0.1.0/24|No|
|subnet_map_public_ip_on_launch|Specify true to indicate that instances launched into the subnet should be assigned a public IP address.|boolean|false|No|
|subnet_assign_ipv6_address_on_creation|Specify true to indicate that network interfaces created in the specified subnet should be assigned an IPv6 address.|boolean|false|No|
|subnet_tag_name|A name tag to assign to the resource.|string|{{ name }}|No|
|subnet_tag_environment|A environment tag to assign to the resource.|string|default|No|
|subnet_tag_description|A description tag to assign to the resource.|string|Managed by Terraform Plus|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|subnet_id|The ID of the subnet.|string|
|subnet_availability_zone|The AZ for the subnet.|string|
|subnet_cidr_block|The CIDR block for the subnet.|string|
|subnet_vpc_id|The VPC ID.|string|

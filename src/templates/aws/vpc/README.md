# vpc

Provides an VPC resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|vpc_cidr_block|The CIDR block for the VPC.|string|10.0.0.0/16|No|
|vpc_instance_tenancy|A tenancy option for instances launched into the VPC|string|default|No|
|vpc_enable_dns_support|A boolean flag to enable/disable DNS support in the VPC.|string|true|No|
|vpc_enable_dns_hostnames|A boolean flag to enable/disable DNS hostnames in the VPC.|string|false|No|
|vpc_enable_classiclink|A boolean flag to enable/disable ClassicLink for the VPC. Only valid in regions and accounts that support EC2 Classic. See the ClassicLink documentation for more information.|string|false|No|
|vpc_enable_classiclink_dns_support|A boolean flag to enable/disable ClassicLink DNS Support for the VPC. Only valid in regions and accounts that support EC2 Classic.|string|false|No|
|vpc_assign_generated_ipv6_cidr_block|Requests an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC. You cannot specify the range of IP addresses, or the size of the CIDR block.|string|false|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the VPC.|string|
|thub_id|The ID of the VPC.|string|
|cidr_block|The CIDR block of the VPC.|string|
|instance_tenancy|Tenancy of instances spin up within VPC.|string|
|enable_dns_support|Whether or not the VPC has DNS support.|boolean|
|enable_dns_hostnames|Whether or not the VPC has DNS hostname support.|boolean|
|enable_classiclink|Whether or not the VPC has Classiclink enabled.|boolean|
|main_route_table_id|The ID of the main route table associated with this VPC. Note that you can change a VPC's main route table by using an aws_main_route_table_association..|string|
|default_network_acl_id|The ID of the network ACL created by default on VPC creation.|string|
|default_security_group_id|The ID of the security group created by default on VPC creation.|string|
|default_route_table_id|The ID of the route table created by default on VPC creation.|string|
|ipv6_association_id|The association ID for the IPv6 CIDR block.|string|
|ipv6_cidr_block|The IPv6 CIDR block.|string|

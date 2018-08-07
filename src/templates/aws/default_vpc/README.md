# aws_network_interface

Provides an Elastic network interface (ENI) resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|default_vpc_enable_dns_support|A boolean flag to enable/disable DNS support in the VPC.|boolean|false|No|
|default_vpc_enable_dns_hostnames|A boolean flag to enable/disable DNS hostnames in the VPC.|boolean|false|No|
|default_vpc_enable_classiclink|A boolean flag to enable/disable ClassicLink for the VPC. Only valid in regions and accounts that support EC2 Classic. See the ClassicLink documentation for more information.|boolean|false|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|arn|Amazon Resource Name (ARN) of VPC.|string|
|id|The ID of the VPC.|string|
|thub_id|The ID of the VPC (hotfix for issue hashicorp/terraform#[7982]).|string|
|cidr_block|The CIDR block of the VPC.|string|
|instance_tenancy|Tenancy of instances spin up within VPC.|string|
|enable_dns_support|Whether or not the VPC has DNS support.|string|
|enable_dns_hostnames|Whether or not the VPC has DNS hostname support.|string|
|enable_classiclink|Whether or not the VPC has Classiclink enabled.|string|
|assign_generated_ipv6_cidr_block|Whether or not an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC was assigned.|string|
|main_route_table_id|The ID of the main route table associated with this VPC. Note that you can change a VPC's main route table by using an aws_main_route_table_association.|string|
|default_network_acl_id|The ID of the network ACL created by default on VPC creation.|string|
|default_security_group_id|The ID of the security group created by default on VPC creation.|string|
|default_route_table_id|The ID of the route table created by default on VPC creation.|string|
|ipv6_association_id|The association ID for the IPv6 CIDR block of the VPC.|string|
|ipv6_cidr_block|The IPv6 CIDR block of the VPC.|string|

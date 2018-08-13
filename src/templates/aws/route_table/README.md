# aws_route_table

Provides a resource to create a VPC routing table.

NOTE on Route Tables and Routes: Terraform currently provides both a standalone Route resource and a Route Table resource with routes defined in-line. At this time you cannot use a Route Table with in-line routes in conjunction with any Route resources. Doing so will cause a conflict of rule settings and will overwrite rules.

NOTE on gateway_id and nat_gateway_id: The AWS API is very forgiving with these two attributes and the aws_route_table resource can be created with a NAT ID specified as a Gateway ID attribute. This will lead to a permanent diff between your configuration and statefile, as the API returns the correct parameters in the returned route table. If you're experiencing constant diffs in your aws_route_table resources, the first thing to check is whether or not you're specifying a NAT ID instead of a Gateway ID, or vice-versa.

NOTE on propagating_vgws and the aws_vpn_gateway_route_propagation resource: If the propagating_vgws argument is present, it's not supported to also define route propagations using aws_vpn_gateway_route_propagation, since this resource will delete any propagating gateways not explicitly listed in propagating_vgws. Omit this argument when defining route propagation using the separate resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|route_table_vpc_id|The VPC ID.|string||Yes|
|route_table_propagating_vgws|A list of virtual gateways for propagation.|list||Yes|
|route_table_route_cidr_block|The CIDR block of the route.|string|10.0.1.0/24|No|
|route_table_route_gateway_id|The Internet Gateway ID.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the routing table.|string|
|thub_id|The ID of the routing table (hotfix for issue hashicorp/terraform#[7982]).|string|

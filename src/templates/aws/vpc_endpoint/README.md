# aws_vpc_endpoint

Provides a VPC Endpoint resource.

NOTE on VPC Endpoints and VPC Endpoint Associations: Terraform provides both standalone VPC Endpoint Associations for Route Tables - (an association between a VPC endpoint and a single route_table_id) and Subnets - (an association between a VPC endpoint and a single subnet_id) and a VPC Endpoint resource with route_table_ids and subnet_ids attributes. Do not use the same resource ID in both a VPC Endpoint resource and a VPC Endpoint Association resource. Doing so will cause a conflict of associations and will overwrite the association.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|vpc_endpoint_vpc_id|The ID of the VPC in which the endpoint will be used.|string||Yes|
|vpc_endpoint_service_name|The service name, in the form com.amazonaws.region.service for AWS services.|string||Yes|
|vpc_endpoint_vpc_endpoint_type|The VPC endpoint type, Gateway or Interface. Defaults to Gateway.|string|Interface|No|
|vpc_endpoint_security_group_ids|The ID of one or more security groups to associate with the network interface. Required for endpoints of type Interface.|list||Yes|
|vpc_endpoint_subnet_ids|The ID of one or more subnets in which to create a network interface for the endpoint. Applicable for endpoints of type Interface.|list||Yes|
|vpc_endpoint_private_dns_enabled|Whether or not to associate a private hosted zone with the specified VPC. Applicable for endpoints of type Interface.|boolean|false|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the VPC endpoint.|string|
|thub_id|The ID of the VPC endpoint (hotfix for issue hashicorp/terraform#[7982]).|string|
|state|The state of the VPC endpoint.|string|
|prefix_list_id|The prefix list ID of the exposed AWS service. Applicable for endpoints of type Gateway.|list|
|cidr_blocks|The list of CIDR blocks for the exposed AWS service. Applicable for endpoints of type Gateway.|list|
|network_interface_ids|One or more network interfaces for the VPC Endpoint. Applicable for endpoints of type Interface.|list|
|dns_entry|The DNS entries for the VPC Endpoint. Applicable for endpoints of type Interface. DNS blocks are documented below.|map|

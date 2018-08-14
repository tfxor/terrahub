# aws_vpc_endpoint_route_table_association

Provides a resource to create an association between a VPC endpoint and routing table.

NOTE on VPC Endpoints and VPC Endpoint Route Table Associations: Terraform provides both a standalone VPC Endpoint Route Table Association (an association between a VPC endpoint and a single route_table_id) and a VPC Endpoint resource with a route_table_ids attribute. Do not use the same route table ID in both a VPC Endpoint resource and a VPC Endpoint Route Table Association resource. Doing so will cause a conflict of associations and will overwrite the association.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|vpc_endpoint_vpc_endpoint_id|The ID of the VPC endpoint with which the routing table will be associated.|string||Yes|
|vpc_endpoint_route_table_id|The ID of the routing table to be associated with the VPC endpoint.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the association.|string|
|thub_id|The ID of the association (hotfix for issue hashicorp/terraform#[7982]).|string|

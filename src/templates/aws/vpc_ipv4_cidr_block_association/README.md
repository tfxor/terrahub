# aws_vpc_ipv4_cidr_block_association

Provides a resource to associate additional IPv4 CIDR blocks with a VPC.

When a VPC is created, a primary IPv4 CIDR block for the VPC must be specified. The aws_vpc_ipv4_cidr_block_association resource allows further IPv4 CIDR blocks to be added to the VPC.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|vpc_ipv4_cidr_block_association_vpc_id|The ID of the VPC to make the association with.|string||Yes|
|vpc_ipv4_cidr_block_association_cidr_block|The additional IPv4 CIDR block to associate with the VPC.|string|172.2.0.0/16|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the VPC CIDR association.|string|
|thub_id|The ID of the VPC CIDR association (hotfix for issue hashicorp/terraform#[7982]).|string|

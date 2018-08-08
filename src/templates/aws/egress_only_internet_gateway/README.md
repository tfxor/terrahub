# aws_egress_only_internet_gateway

[IPv6 only] Creates an egress-only Internet gateway for your VPC. An egress-only Internet gateway is used to enable outbound communication over IPv6 from instances in your VPC to the Internet, and prevents hosts outside of your VPC from initiating an IPv6 connection with your instance.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|egress_only_internet_gateway_vpc_id|The VPC ID to create in.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the Egress Only Internet Gateway.|string|
|thub_id|The ID of the Egress Only Internet Gateway (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|

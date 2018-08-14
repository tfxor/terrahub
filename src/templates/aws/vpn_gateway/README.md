# aws_vpn_gateway

Provides a resource to create a VPC VPN Gateway.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|vpn_gateway_vpc_id|The VPC ID to create in.|string||Yes|
|vpn_gateway_availability_zone|The Availability Zone for the virtual private gateway.|string|us-east-1a|No|
|vpn_gateway_amazon_side_asn|The Autonomous System Number (ASN) for the Amazon side of the gateway. If you don't specify an ASN, the virtual private gateway is created with the default ASN.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the VPN Gateway.|string|
|thub_id|The ID of the VPN Gateway (hotfix for issue hashicorp/terraform#[7982]).|string|

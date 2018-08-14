# aws_vpn_gateway_attachment

Provides a Virtual Private Gateway attachment resource, allowing for an existing hardware VPN gateway to be attached and/or detached from a VPC.

Note: The aws_vpn_gateway resource can also automatically attach the Virtual Private Gateway it creates to an existing VPC by setting the vpc_id attribute accordingly.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|vpn_gateway_attachment_vpc_id|The ID of the VPC.|string||Yes|
|vpn_gateway_attachment_vpn_gateway_id|The ID of the Virtual Private Gateway.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|vpc_id|The ID of the VPC that Virtual Private Gateway is attached to.|string|
|vpn_gateway_id|The ID of the Virtual Private Gateway.|string|
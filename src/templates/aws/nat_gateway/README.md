# aws_nat_gateway

Provides a resource to create a VPC NAT Gateway.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|nat_gateway_allocation_id|The Allocation ID of the Elastic IP address for the gateway.|string||Yes|
|nat_gateway_subnet_id|The Subnet ID of the subnet in which to place the gateway.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the NAT Gateway.|string|
|thub_id|The ID of the NAT Gateway (hotfix for issue hashicorp/terraform#[7982]).|string|
|allocation_id|The Allocation ID of the Elastic IP address for the gateway.|string|
|subnet_id|The Subnet ID of the subnet in which the NAT gateway is placed.|string|
|network_interface_id|The ENI ID of the network interface created by the NAT gateway.|string|
|private_ip|The private IP address of the NAT Gateway.|string|
|public_ip|The public IP address of the NAT Gateway.|string|
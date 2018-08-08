# aws_default_subnet

Provides a resource to manage a default AWS VPC subnet in the current region.

The aws_default_subnet behaves differently from normal resources, in that Terraform does not create this resource, but instead "adopts" it into management.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|default_subnet_availability_zone|The AZ for the subnet.|string|us-east-1a|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the subnet|string|
|thub_id|The ID of the subnet (hotfix for issue hashicorp/terraform#[7982]).|string|
|availability_zone|The AZ for the subnet.|string|
|cidr_block|The CIDR block for the subnet.|string|
|vpc_id|The VPC ID.|string|
|ipv6_association_id|The association ID for the IPv6 CIDR block.|string|
|ipv6_cidr_block|The IPv6 CIDR block.|string|

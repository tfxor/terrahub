# aws_network_interface

Provides an Elastic network interface (ENI) resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|network_interface_subnet_id|Subnet ID the ENI is in.|string||Yes|
|network_interface_security_groups|List of security groups attached to the ENI.|list||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID the ENI is in.|string|
|thub_id|The ID the ENI is in.|string|
|subnet_id|Subnet ID the ENI is in.|string|
|description|A description for the network interface.|string|
|private_ips|List of private IPs assigned to the ENI.|string|
|security_groups|List of security groups attached to the ENI.|string|
|attachment|Block defining the attachment of the ENI.|string|
|source_dest_check|Whether source destination checking is enabled.|string|
|tags|Tags assigned to the ENI.|string|

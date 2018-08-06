# aws_eip

Provides an Elastic IP resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|eip_vpc|Boolean if the EIP is in a VPC or not.|boolean|true|no|
|eip_instance_id|EC2 instance ID.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|Contains the EIP allocation ID.|string|
|private_ip|Contains the private IP address (if in VPC).|string|
|public_ip|Contains the public IP address.|string|
|instance|Contains the ID of the attached instance.|string|
|network_interface|Contains the ID of the attached network interface.|string|
|associate_with_private_ip|Contains the user specified private IP address (if in VPC).|string|

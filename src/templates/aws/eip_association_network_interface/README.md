# aws_eip_association

Provides an AWS EIP Association as a top level resource, to associate and disassociate Elastic IPs from AWS Instances and Network Interfaces.

NOTE: Do not use this resource to associate an EIP to aws_lb or aws_nat_gateway resources. Instead use the allocation_id available in those resources to allow AWS to manage the association, otherwise you will see AuthFailure errors.

NOTE: aws_eip_association is useful in scenarios where EIPs are either pre-existing or distributed to customers or users and therefore cannot be changed.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|eip_association_allocation_id|The allocation ID. This is required for EC2-VPC.|string||Yes|
|eip_association_allow_reassociation|Whether to allow an Elastic IP to be re-associated. Defaults to true in VPC.|boolean|true|No|
|eip_association_network_interface_id|The ID of the network interface. If the instance has more than one network interface, you must specify a network interface ID.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|association_id|The ID that represents the association of the Elastic IP address with an instance.|string|
|allocation_id|The allocation ID. This is required for EC2-VPC.|string|
|instance_id|The ID of the instance. This is required for EC2-Classic. For EC2-VPC, you can specify either the instance ID or the network interface ID, but not both. The operation fails if you specify an instance ID unless exactly one network interface is attached.|string|
|network_interface_id|The ID of the network interface. If the instance has more than one network interface, you must specify a network interface ID.|string|
|private_ip_address|The primary or secondary private IP address to associate with the Elastic IP address. If no private IP address is specified, the Elastic IP address is associated with the primary private IP address.|string|
|public_ip|The Elastic IP address. This is required for EC2-Classic.|string|

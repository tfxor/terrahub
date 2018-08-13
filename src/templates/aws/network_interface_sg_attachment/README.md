# aws_network_interface_sg_attachment

This resource attaches a security group to an Elastic Network Interface (ENI). It can be used to attach a security group to any existing ENI, be it a secondary ENI or one attached as the primary interface on an instance.

NOTE on instances, interfaces, and security groups: Terraform currently provides the capability to assign security groups via the aws_instance and the aws_network_interface resources. Using this resource in conjunction with security groups provided in-line in those resources will cause conflicts, and will lead to spurious diffs and undefined behavior - please use one or the other.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|network_interface_sg_attachment_security_group_id|The ID of the security group.|string||Yes|
|network_interface_sg_attachment_network_interface_id|The ID of the network interface to attach to.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|

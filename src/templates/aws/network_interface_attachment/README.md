# aws_network_interface_attachment

Attach an Elastic network interface (ENI) resource with EC2 instance.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|network_interface_attachment_instance_id|Instance ID to attach.|string||Yes|
|network_interface_attachment_network_interface_id|ENI ID to attach.|string||Yes|
|network_interface_attachment_device_index|Network interface index (int).|number|0|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|instance_id|Instance ID.|string|
|network_interface_id|Network interface ID.|string|
|attachment_id|The ENI Attachment ID.
|status|The status of the Network Interface Attachment.|string|

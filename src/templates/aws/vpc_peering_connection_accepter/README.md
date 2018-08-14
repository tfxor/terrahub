# aws_vpc_peering_connection_accepter
Provides a resource to manage the accepter's side of a VPC Peering Connection.

When a cross-account (requester's AWS account differs from the accepter's AWS account) or an inter-region VPC Peering Connection is created, a VPC Peering Connection resource is automatically created in the accepter's account. The requester can use the aws_vpc_peering_connection resource to manage its side of the connection and the accepter can use the aws_vpc_peering_connection_accepter resource to "adopt" its side of the connection into management.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|vpc_peering_vpc_peering_connection_id|The VPC Peering Connection ID to manage.|string||yes|
|vpc_peering_auto_accept||boolean|false|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the VPC Peering Connection.|string|
|thub_id|The ID of the VPC Peering Connection (hotfix for issue hashicorp/terraform#[7982]).|string|
|accept_status|The status of the VPC Peering Connection request.|string|
|vpc_id|The ID of the accepter VPC.|string|
|peer_vpc_id|The ID of the requester VPC.|string|
|peer_owner_id|The AWS account ID of the owner of the requester VPC.|string|
|peer_region|The region of the accepter VPC.|string|
|accepter|A configuration block that describes VPC Peering Connection options set for the accepter VPC.|string|
|requester|A configuration block that describes VPC Peering Connection options set for the requester VPC.|string|

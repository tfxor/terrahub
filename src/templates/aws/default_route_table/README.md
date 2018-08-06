# aws_default_route_table

Provides a resource to manage a Default VPC Routing Table.

Each VPC created in AWS comes with a Default Route Table that can be managed, but not destroyed. This is an advanced resource, and has special caveats to be aware of when using it. Please read this document in its entirety before using this resource. It is recommended you do not use both aws_default_route_table to manage the default route table and use the aws_main_route_table_association, due to possible conflict in routes.

The aws_default_route_table behaves differently from normal resources, in that Terraform does not create this resource, but instead attempts to "adopt" it into management. We can do this because each VPC created has a Default Route Table that cannot be destroyed, and is created with a single route.

When Terraform first adopts the Default Route Table, it immediately removes all defined routes. It then proceeds to create any routes specified in the configuration. This step is required so that only the routes specified in the configuration present in the Default Route Table.

For more information about Route Tables, see the AWS Documentation on Route Tables.

For more information about managing normal Route Tables in Terraform, see our documentation on aws_route_table.

NOTE on Route Tables and Routes: Terraform currently provides both a standalone Route resource and a Route Table resource with routes defined in-line. At this time you cannot use a Route Table with in-line routes in conjunction with any Route resources. Doing so will cause a conflict of rule settings and will overwrite routes.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|default_route_table_id|The ID of the Default Routing Table.|string||Yes|
|default_route_table_propagating_vgws|A list of virtual gateways for propagation.|list||Yes|
|default_route_table_cidr_block|The CIDR block of the route.|string||Yes|
|default_route_table_egress_only_gateway_id|The Egress Only Internet Gateway ID.|string||Yes|
|default_route_table_gateway_id|The Internet Gateway ID.|string||Yes|
|default_route_table_nat_gateway_id|The NAT Gateway ID.|string||Yes|
|default_route_table_instance_id|The EC2 instance ID.|string||Yes|
|default_route_table_vpc_peering_connection_id|The VPC Peering ID.|string||Yes|
|default_route_table_network_interface_id|The ID of the elastic network interface (eni) to use.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the routing table|string|
|thub_id|The ID of the routing table|string|

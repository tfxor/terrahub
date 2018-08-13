# aws_vpn_connection

Provides a VPN connection connected to a VPC. These objects can be connected to customer gateways, and allow you to establish tunnels between your network and the VPC.

Note: All arguments including tunnel1_preshared_key and tunnel2_preshared_key will be stored in the raw state as plain-text. Read more about sensitive data in state.

Note: The CIDR blocks in the arguments tunnel1_inside_cidr and tunnel2_inside_cidr must have a prefix of /30 and be a part of a specific range. Read more about this in the AWS documentation.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|vpn_connection_vpn_gateway_id|The ID of the virtual private gateway.|string||Yes|
|vpn_connection_customer_gateway_id|The ID of the customer gateway.|string||Yes|
|vpn_connection_type|The type of VPN connection. The only type AWS supports at this time is ipsec.1.|string|ipsec.1|No|
|vpn_connection_static_routes_only|Whether the VPN connection uses static routes exclusively. Static routes must be used for devices that don't support BGP.|boolean|false|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The amazon-assigned ID of the VPN connection.|string|
|thub_id|The amazon-assigned ID of the VPN connection (hotfix for issue hashicorp/terraform#[7982]).|string|
|customer_gateway_configuration|The configuration information for the VPN connection's customer gateway (in the native XML format).|string|
|customer_gateway_id\The ID of the customer gateway to which the connection is attached.|string|
|static_routes_only|Whether the VPN connection uses static routes exclusively.|string|
|tags|Tags applied to the connection.|map|
|tunnel1_address|The public IP address of the first VPN tunnel.|string|
|tunnel1_cgw_inside_address|The RFC 6890 link-local address of the first VPN tunnel (Customer Gateway Side).|string|
|tunnel1_vgw_inside_address|The RFC 6890 link-local address of the first VPN tunnel (VPN Gateway Side).|string|
|tunnel1_preshared_key|The preshared key of the first VPN tunnel.|string|
|tunnel1_bgp_asn|The bgp asn number of the first VPN tunnel.|string|
|tunnel1_bgp_holdtime|The bgp holdtime of the first VPN tunnel.|string|
|tunnel2_address|The public IP address of the second VPN tunnel.|string|
|tunnel2_cgw_inside_address|The RFC 6890 link-local address of the second VPN tunnel (Customer Gateway Side).|string|
|tunnel2_vgw_inside_address|The RFC 6890 link-local address of the second VPN tunnel (VPN Gateway Side).|string|
|tunnel2_preshared_key|The preshared key of the second VPN tunnel.|string|
|tunnel2_bgp_asn|The bgp asn number of the second VPN tunnel.|string|
|tunnel2_bgp_holdtime|The bgp holdtime of the second VPN tunnel.|string|
|type|The type of VPN connection.|string|
|vpn_gateway_id|The ID of the virtual private gateway to which the connection is attached.|string|
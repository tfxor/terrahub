# aws_spot_fleet_request

Provides an EC2 Spot Fleet Request resource. This allows a fleet of Spot instances to be requested on the Spot market.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|spot_fleet_request_role_name||string|Grants the Spot fleet permission to terminate Spot instances on your behalf when you cancel its Spot fleet request using CancelSpotFleetRequests or when the Spot fleet request expires, if you set terminateInstancesWithExpiration.|Yes|
|spot_fleet_request_replace_unhealthy_instances|Indicates whether Spot fleet should replace unhealthy instances. Default false.|boolean|false|No|
|spot_fleet_request_spot_price|The maximum bid price per unit hour.|string|0.03|No|
|spot_fleet_request_allocation_strategy|Indicates how to allocate the target capacity across the Spot pools specified by the Spot fleet request. The default is lowestPrice.|string|lowestPrice|No|
|spot_fleet_request_target_capacity|The number of units to request. You can choose to set the target capacity in terms of instances or a performance characteristic that is important to your application workload, such as vCPUs, memory, or I/O.|number|6|No|
|spot_fleet_request_valid_from|The start date and time of the request, in UTC RFC3339 format(for example, YYYY-MM-DDTHH:MM:SSZ). The default is to start fulfilling the request immediately.|string|2019-11-04T20:44:20Z|No|
|spot_fleet_request_valid_until|The end date and time of the request, in UTC RFC3339 format(for example, YYYY-MM-DDTHH:MM:SSZ). At this point, no new Spot instance requests are placed or enabled to fulfill the request. Defaults to 24 hours.|string|2019-11-04T20:44:20Z|No|
|spot_fleet_request_wait_for_fulfillment|If set, Terraform will wait for the Spot Request to be fulfilled, and will throw an error if the timeout of 10m is reached.|boolean|false|No|
|spot_fleet_request_fleet_type|The type of fleet request. Indicates whether the Spot Fleet only requests the target capacity or also attempts to maintain it. Default is maintain.|string|maintain|No|
|spot_fleet_request_instance_interruption_behaviour| Indicates whether a Spot instance stops or terminates when it is interrupted. Default is terminate.|string|terminate|No|
|spot_fleet_request_ls_instance_type|The type of instance to start. Updates to this field will trigger a stop/start of the EC2 instance.|string|t2.micro|No|
|spot_fleet_request_ls_ami|The AMI to use for the instance.|string||Yes|
|spot_fleet_request_ls_spot_price|The maximum bid price per unit hour.|string|0.03|No|
|spot_fleet_request_ls_iam_instance_profile_arn|The IAM Instance Profile to launch the instance with.|string||Yes|
|spot_fleet_request_ls_availability_zone|The AZ to start the instance in.|string|us-east-1a|No|
|spot_fleet_request_ls_weighted_capacity|The number of units to request. You can choose to set the target capacity in terms of instances or a performance characteristic that is important to your application workload, such as vCPUs, memory, or I/O.|number|3|No|
|spot_fleet_request_ls_placement_tenancy|The tenancy of the instance (if the instance is running in a VPC). An instance with a tenancy of dedicated runs on single-tenant hardware. The host tenancy is not supported for the import-instance command.|string|dedicated|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|eni_id|The Spot fleet request ID.|string|
|spot_request_state|The state of the Spot fleet request.|string|

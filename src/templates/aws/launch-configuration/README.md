# aws_launch_configuration

Provides a resource to create a new launch configuration, used for autoscaling groups.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string|588360414558|Yes|
|region|This is the AWS region.|string|us-west-2|Yes|
|env|The name of environment.|string|prod|No|
|cloud_domain|The name of cloud domain.|string|prod-shared.com|No|
|prod_phase|The prod phase.|string|prod|No|
|stack|The stack.|string|steam|No|
|launch_configuration_name|The name of the launch configuration. If you leave this blank, Terraform will auto-generate a unique name.|string|{{ name }}|No|
|launch_configuration_name_prefix|Creates a unique name beginning with the specified prefix. Conflicts with name.|string|steam-|No|
|launch_configuration_image_id|The EC2 image ID to launch.|string||Yes|
|launch_configuration_instance_type|The size of instance to launch.|string||Yes|
|launch_configuration_key_name|The key name that should be used for the instance.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the launch configuration.|string|
|name|The name of the launch configuration.|string|

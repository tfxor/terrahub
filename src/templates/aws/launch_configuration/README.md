# aws_launch_configuration

Provides a resource to create a new launch configuration, used for autoscaling groups.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|launch_configuration_name|The name of the launch configuration. If you leave this blank, Terraform will auto-generate a unique name.|string|{{ name }}|No|
|launch_configuration_image_id|The EC2 image ID to launch.|string||Yes|
|launch_configuration_iam_instance_profile|The IAM instance profile to associate with launched instances.|string||Yes|
|launch_configuration_security_groups|A list of associated security group IDS.|list||Yes|
|launch_configuration_instance_type|The size of instance to launch.|string||Yes|
|launch_configuration_key_name|The key name that should be used for the instance.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the launch configuration.|string|
|thub_id|The ID of the launch configuration.|string|
|name|The name of the launch configuration.|string|

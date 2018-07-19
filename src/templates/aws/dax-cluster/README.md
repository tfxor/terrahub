# aws_dax_cluster

Provides a DAX Cluster resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|dax_cluster_id|Group identifier. DAX converts this name to lowercase.|string||Yes|
|dax_cluster_iam_role_name|A valid Amazon Resource Name (NAME) that identifies an IAM role. At runtime, DAX will assume this role and use the role's permissions to access DynamoDB on your behalf.|string||Yes|
|dax_cluster_node_type|The compute and memory capacity of the nodes.|string|dax.t2.small|Yes|
|dax_cluster_replication_factor|The number of nodes in the DAX cluster. A replication factor of 1 will create a single-node cluster, without any read replicas.|string|1|Yes|
|dax_cluster_availability_zones|List of Availability Zones in which the nodes will be created.|list|["us-east-1a","us-east-1b"]|No|
|dax_cluster_description|Description for the cluster.|string|{{ name }} Managed by TerraHub|No|
|dax_cluster_notification_topic_name|An Amazon Resource Name (NAME) of an SNS topic to send DAX notifications to.|string||No|
|dax_cluster_maintenance_window|Specifies the weekly time range for when maintenance on the cluster is performed. The format is ddd:hh24:mi-ddd:hh24:mi (24H Clock UTC). The minimum maintenance window is a 60 minute period. Example: sun:05:00-sun:09:00.|string|sun:05:00-sun:09:00|No|
|dax_cluster_security_group_ids|One or more VPC security groups associated with the cluster.|list||No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|arn|The ARN of the DAX cluster.|string|
|nodes|List of node objects including id, address, port and availability_zone.|list|
|configuration_endpoint|The configuration endpoint for this DAX cluster, consisting of a DNS name and a port number.|string|
|cluster_address|The DNS name of the DAX cluster without the port appended.|string|
|port|The port used by the configuration endpoint.|string|

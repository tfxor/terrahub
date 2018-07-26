# Define list of variables to be used in main.tf

############
# provider #
############
variable "account_id" {
  description = "Allowed AWS account ID, to prevent you from mistakenly using an incorrect one (and potentially end up destroying a live environment)."
}

variable "region" {
  description = "This is the AWS region."
}

#############
# top level #
#############
variable "dax_cluster_id" {
  description = "Group identifier. DAX converts this name to lowercase."
}

variable "dax_cluster_iam_role_name" {
  description = "A valid Amazon Resource Name (NAME) that identifies an IAM role. At runtime, DAX will assume this role and use the role's permissions to access DynamoDB on your behalf."
}

variable "dax_cluster_node_type" {
  description = "The compute and memory capacity of the nodes."
}

variable "dax_cluster_replication_factor" {
  description = "The number of nodes in the DAX cluster. A replication factor of 1 will create a single-node cluster, without any read replicas."
}

#####################
# optional atribute #
#####################
variable "dax_cluster_availability_zones" {
  description = "List of Availability Zones in which the nodes will be created."
  type        = "list"
}

variable "dax_cluster_description" {
  description = "Description for the cluster."
}

variable "dax_cluster_notification_topic_name" {
  description = "An Amazon Resource Name (NAME) of an SNS topic to send DAX notifications to."
}

variable "dax_cluster_maintenance_window" {
  description = "Specifies the weekly time range for when maintenance on the cluster is performed. The format is ddd:hh24:mi-ddd:hh24:mi (24H Clock UTC). The minimum maintenance window is a 60 minute period. Example: sun:05:00-sun:09:00."
}

variable "dax_cluster_security_group_ids" {
  description = "One or more VPC security groups associated with the cluster."
  type        = "list"
}

########
# tags #
########
variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

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
variable "spot_fleet_request_role_name" {
  description = "Grants the Spot fleet permission to terminate Spot instances on your behalf when you cancel its Spot fleet request using CancelSpotFleetRequests or when the Spot fleet request expires, if you set terminateInstancesWithExpiration."
}

variable "spot_fleet_request_replace_unhealthy_instances" {
  description = "Indicates whether Spot fleet should replace unhealthy instances. Default false."
}

variable "spot_fleet_request_spot_price" {
  description = "The maximum bid price per unit hour."
}

variable "spot_fleet_request_allocation_strategy" {
  description = "Indicates how to allocate the target capacity across the Spot pools specified by the Spot fleet request. The default is lowestPrice."
}

variable "spot_fleet_request_target_capacity" {
  description = "The number of units to request. You can choose to set the target capacity in terms of instances or a performance characteristic that is important to your application workload, such as vCPUs, memory, or I/O."
}

variable "spot_fleet_request_valid_from" {
  description = "The start date and time of the request, in UTC RFC3339 format(for example, YYYY-MM-DDTHH:MM:SSZ). The default is to start fulfilling the request immediately."
}

variable "spot_fleet_request_valid_until" {
  description = "The end date and time of the request, in UTC RFC3339 format(for example, YYYY-MM-DDTHH:MM:SSZ). At this point, no new Spot instance requests are placed or enabled to fulfill the request. Defaults to 24 hours."
}

variable "spot_fleet_request_wait_for_fulfillment" {
  description = "If set, Terraform will wait for the Spot Request to be fulfilled, and will throw an error if the timeout of 10m is reached."
}

variable "spot_fleet_request_fleet_type" {
  description = "The type of fleet request. Indicates whether the Spot Fleet only requests the target capacity or also attempts to maintain it. Default is maintain."
}

variable "spot_fleet_request_instance_interruption_behaviour" {
  description = "Indicates whether a Spot instance stops or terminates when it is interrupted. Default is terminate."
}

########################
# launch specification #
########################
variable "spot_fleet_request_ls_instance_type" {
  description = "The type of instance to start. Updates to this field will trigger a stop/start of the EC2 instance."
}

variable "spot_fleet_request_ls_ami" {
  description = "The AMI to use for the instance."
}

variable "spot_fleet_request_ls_spot_price" {
  description = "The maximum bid price per unit hour."
}

variable "spot_fleet_request_ls_iam_instance_profile_arn" {
  description = "The IAM Instance Profile to launch the instance with."
}

variable "spot_fleet_request_ls_availability_zone" {
  description = "The AZ to start the instance in."
}

variable "spot_fleet_request_ls_weighted_capacity" {
  description = "The number of units to request. You can choose to set the target capacity in terms of instances or a performance characteristic that is important to your application workload, such as vCPUs, memory, or I/O."
}

variable "spot_fleet_request_ls_placement_tenancy" {
  description = "The tenancy of the instance (if the instance is running in a VPC). An instance with a tenancy of dedicated runs on single-tenant hardware. The host tenancy is not supported for the import-instance command."
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

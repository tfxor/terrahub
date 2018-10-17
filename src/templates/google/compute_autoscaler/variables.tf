# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_compute_autoscaler_name" {
  description = "Name of the resource. The name must be 1-63 characters long and match the regular expression [a-z]([-a-z0-9]*[a-z0-9])? which means the first character must be a lowercase letter, and all following characters must be a dash, lowercase letter, or digit, except the last character, which cannot be a dash."
}

variable "google_compute_autoscaler_zone" {
  description = "URL of the zone where the instance group resides."
}

variable "google_compute_autoscaler_target" {
  description = "URL of the managed instance group that this autoscaler will scale."
}

variable "google_compute_autoscaler_description" {
  description = "An optional description of this resource."
}

variable "google_project_id" {
  description = "The ID of the project in which the resource belongs. If it is not provided, the provider project is used."
}

######################
# autoscaling policy #
######################
variable "google_compute_autoscaler_policy_max_replicas" {
  description = "The maximum number of instances that the autoscaler can scale up to. This is required when creating or updating an autoscaler. The maximum number of replicas should not be lower than minimal number of replicas."
}

variable "google_compute_autoscaler_policy_min_replicas" {
  description = "The minimum number of replicas that the autoscaler can scale down to. This cannot be less than 0. If not provided, autoscaler will choose a default value depending on maximum number of instances allowed."
}

variable "google_compute_autoscaler_policy_cooldown_period" {
  description = "The number of seconds that the autoscaler should wait before it starts collecting information from a new instance. This prevents the autoscaler from collecting information when the instance is initializing, during which the collected usage would not be reliable. The default time autoscaler waits is 60 seconds. Virtual machine initialization times might vary because of numerous factors. We recommend that you test how long an instance may take to initialize. To do this, create an instance and time the startup process."
}

variable "google_compute_autoscaler_policy_cpu_utilization_target" {
  description = "The target CPU utilization that the autoscaler should maintain. Must be a float value in the range (0, 1]. If not specified, the default is 0.6. If the CPU level is below the target utilization, the autoscaler scales down the number of instances until it reaches the minimum number of instances you specified or until the average CPU of your instances reaches the target utilization. If the average CPU is above the target utilization, the autoscaler scales up until it reaches the maximum number of instances you specified or until the average utilization reaches the target utilization."
}

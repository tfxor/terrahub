# Define list of variables to be used in main.tf

############
# provider #
############
variable "project" {
  description = "Project name"
}

variable "project_id" {
  description = "Project ID"
}

variable "region" {
  description = "Region"
}

#############
# top level #
#############

variable "name" {
  description = "The name of the instance template."
}

variable "description" {
  description = "A brief description of this resource."
}

variable "instance_description" {
  description = "A brief description to use for instances created from this template."
}

variable "machine_type" {
  description = "The machine type to create."
}

variable "can_ip_forward" {
  description = "Whether to allow sending and receiving of packets with non-matching source or destination IPs."
}

variable "disk_source_image" {
  description = "The image from which to initialize this disk. "
}

variable "disk_auto_delete" {
  description = "Whether or not the disk should be auto-deleted."
}

variable "disk_boot" {
  description = "Indicates that this is a boot disk."
}

variable "network_interface_network" {
  description = "Networks to attach to instances created from this template. "
}

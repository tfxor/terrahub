# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_compute_attached_disk_name" {
  description = "Name or self_link of the disk that will be attached."
}

variable "google_compute_attached_instance_name" {
  description = "name or self_link of the compute instance that the disk will be attached to. If the self_link is provided then zone and project are extracted from the self link. If only the name is used then zone and project must be defined as properties on the resource or provider."
}

variable "google_project_id" {
  description = "The project that the referenced compute instance is a part of. If instance is referenced by its self_link the project defined in the link will take precedence."
}

variable "google_compute_attached_disk_zone" {
  description = "The zone that the referenced compute instance is located within. If instance is referenced by its self_link the zone defined in the link will take precedence."
}

variable "google_compute_attached_device_name" {
  description = "Specifies a unique device name of your choice that is reflected into the /dev/disk/by-id/google-* tree of a Linux operating system running within the instance. This name can be used to reference the device for mounting, resizing, and so on, from within the instance.If not specified, the server chooses a default device name to apply to this disk, in the form persistent-disks-x, where x is a number assigned by Google Compute Engine."
}

variable "google_compute_attached_disk_mode" {
  description = "The mode in which to attach this disk, either READ_WRITE or READ_ONLY. If not specified, the default is to attach the disk in READ_WRITE mode."
}

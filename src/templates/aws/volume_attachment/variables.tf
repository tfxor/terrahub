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
variable "volume_attachment_device_name" {
  description = "The device name to expose to the instance (for example, /dev/sdh or xvdh)"
}

variable "volume_attachment_volume_id" {
  description = "ID of the Instance to attach to."
}

variable "volume_attachment_instance_id" {
  description = "ID of the Volume to be attached."
}

variable "volume_attachment_force_detach" {
  description = "Set to true if you want to force the volume to detach. Useful if previous attempts failed, but use this option only as a last resort, as this can result in data loss. See Detaching an Amazon EBS Volume from an Instance for more information."
}

variable "volume_attachment_skip_destroy" {
  description = "Set this to true if you do not wish to detach the volume from the instance to which it is attached at destroy time, and instead just remove the attachment from Terraform state. This is useful when destroying an instance which has volumes created by some other means attached."
}

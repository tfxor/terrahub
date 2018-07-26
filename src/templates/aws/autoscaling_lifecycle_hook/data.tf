data "template_file" "notification_metadata" {
  template = <<EOF
{
  "cloud_app": "$${cloud_app_name}"
  "region": "$${region}"
}
EOF

  vars {
    cloud_app_name    = "${var.autoscaling_lifecycle_hook_name}"
    region            = "${var.region}"
  }
}
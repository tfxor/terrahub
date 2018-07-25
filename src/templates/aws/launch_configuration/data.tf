data "template_file" "user_data" {
  template = <<EOF
export CLOUD_APP=$${cloud_app_name}
export EC2_REGION=$${region}
EOF

  vars {
    cloud_app_name    = "${var.launch_configuration_name}-${var.region}"
    region            = "${var.region}"
  }
}
data "aws_vpc" "selected" {
  tags {
    Name = "${var.env} ${local.region} ${var.security_group_vpc_name}"
  }
}

data "aws_region" "current" {
  current = true
}
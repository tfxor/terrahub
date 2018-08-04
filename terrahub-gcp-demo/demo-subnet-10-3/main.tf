resource "google_compute_subnetwork" "demo-subnet-10-3" {
  project       = "${var.project_id}"
  name          = "${var.subnet_name}"
  ip_cidr_range = "${var.subnet_cidr}"
  region        = "${var.region}"
  network       = "${data.terraform_remote_state.network.network_self_link}"

  secondary_ip_range {
    range_name    = "${var.subnet_secondary_range_name}"
    ip_cidr_range = "${var.subnet_secondary_range_cidr}"
  }
}

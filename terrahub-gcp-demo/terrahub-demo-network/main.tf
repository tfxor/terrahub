resource "google_compute_network" "terrahub-demo-network" {
  name                    = "${var.name}"
  auto_create_subnetworks = "${var.auto_create_subnetworks}"
  project                 = "${var.project_id}"

  description = "${var.description}"
}

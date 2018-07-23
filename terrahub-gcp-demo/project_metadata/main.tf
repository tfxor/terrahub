resource "google_compute_project_metadata" "project_metadata" {
  project = "${var.project_id}"

  metadata {
    Name     = "${var.name}"
    AccOwner = "${var.owner}"
    Org      = "${var.org}"
  }
}

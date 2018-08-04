resource "google_compute_project_metadata_item" "metadata-item-env" {
  project = "${var.project_id}"
  key     = "${var.keyname}"
  value   = "${var.keyvalue}"
}


provider "google" {
  # credentials = "${file("${path.module}/../credentials.json")}"
  region  = "${var.region}"
  project = "${var.project}"
}

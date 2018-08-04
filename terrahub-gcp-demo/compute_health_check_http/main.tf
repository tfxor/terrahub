resource "google_compute_health_check" "compute_health_check_http" {
  project             = "${var.project_id}"
  name                = "${var.name}"
  check_interval_sec  = "${var.check_interval_sec}"
  timeout_sec         = "${var.timeout_sec}"
  healthy_threshold   = "${var.healthy_threshold}"
  unhealthy_threshold = "${var.unhealthy_threshold}"

  http_health_check {
    request_path = "${var.request_path}"
    port         = "${var.port}"
  }
}

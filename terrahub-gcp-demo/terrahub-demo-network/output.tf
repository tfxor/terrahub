# Define list of variables to be output

output "network_self_link" {
  value = "${google_compute_network.terrahub-demo-network.self_link}"
}
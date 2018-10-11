# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "compute_network_peering_name" {
  description = "Name of the peering."
}

variable "compute_network_peering_network" {
  description = "Resource link of the network to add a peering to."
}

variable "compute_network_peering_peer_network" {
  description = "Resource link of the peer network."
}

variable "compute_network_peering_auto_create_routes" {
  description = "If set to true, the routes between the two networks will be created and managed automatically."
}

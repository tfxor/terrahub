# Define list of variables to be used in main.tf

#############
# top level #
#############
variable "google_compute_forwarding_rule_name" {
  description = "Name of the resource; provided by the client when the resource is created. The name must be 1-63 characters long, and comply with RFC1035. Specifically, the name must be 1-63 characters long and match the regular expression [a-z]([-a-z0-9]*[a-z0-9])? which means the first character must be a lowercase letter, and all following characters must be a dash, lowercase letter, or digit, except the last character, which cannot be a dash."
}

variable "google_compute_forwarding_rule_description" {
  description = "An optional description of this resource. Provide this property when you create the resource."
}

variable "google_compute_forwarding_rule_ip_address" {
  description = " IP address that this forwarding rule is serving on behalf of. Addresses are restricted based on the forwarding rule's load balancing scheme (EXTERNAL or INTERNAL) and scope (global or regional). When the load balancing scheme is EXTERNAL, for global forwarding rules, the address must be a global IP, and for regional forwarding rules, the address must live in the same region as the forwarding rule. If this field is empty, an ephemeral IPv4 address from the same scope (global or regional) will be assigned. A regional forwarding rule supports IPv4 only. A global forwarding rule supports either IPv4 or IPv6. When the load balancing scheme is INTERNAL, this can only be an RFC 1918 IP address belonging to the network/subnet configured for the forwarding rule. By default, if this field is empty, an ephemeral internal IP address will be automatically allocated from the IP range of the subnet or network configured for this forwarding rule. An address can be specified either by a literal IP address or a URL reference to an existing Address resource."
}

variable "google_compute_forwarding_rule_ip_protocol" {
  description = "The IP protocol to which this rule applies. Valid options are TCP, UDP, ESP, AH, SCTP or ICMP. When the load balancing scheme is INTERNAL, only TCP and UDP are valid."
}

variable "google_compute_forwarding_rule_ip_version" {
  description = "The IP Version that will be used by this forwarding rule. Valid options are IPV4 or IPV6. This can only be specified for a global forwarding rule."
}

variable "google_network" {
  description = "For internal load balancing, this field identifies the network that the load balanced IP should belong to for this Forwarding Rule. If this field is not specified, the default network will be used. This field is not used for external load balancing."
}

variable "google_compute_forwarding_rule_port_range" {
  description = "This field is used along with the target field for TargetHttpProxy, TargetHttpsProxy, TargetSslProxy, TargetTcpProxy, TargetVpnGateway, TargetPool, TargetInstance. Applicable only when IPProtocol is TCP, UDP, or SCTP, only packets addressed to ports in the specified range will be forwarded to target. Forwarding rules with the same [IPAddress, IPProtocol] pair must have disjoint port ranges."
}

variable "google_subnetwork" {
  description = "A reference to a subnetwork. For internal load balancing, this field identifies the subnetwork that the load balanced IP should belong to for this Forwarding Rule. If the network specified is in auto subnet mode, this field is optional. However, if the network is in custom subnet mode, a subnetwork must be specified. This field is not used for external load balancing."
}

variable "google_target" {
  description = "A reference to a TargetPool resource to receive the matched traffic. For regional forwarding rules, this target must live in the same region as the forwarding rule. For global forwarding rules, this target must be a global load balancing resource. The forwarded traffic must be of a type appropriate to the target object. This field is not used for internal load balancing."
}

variable "google_compute_forwarding_rule_network_tier" {
  description = "The networking tier used for configuring this address. This field can take the following values: PREMIUM or STANDARD. If this field is not specified, it is assumed to be PREMIUM."
}

variable "google_project_region" {
  description = "A reference to the region where the regional forwarding rule resides. This field is not applicable to global forwarding rules."
}

variable "google_project_id" {
  description = "The ID of the project in which the resource belongs. If it is not provided, the provider project is used."
}

variable "google_service_label" {
  description = "An optional prefix to the service name for this Forwarding Rule. If specified, will be the first label of the fully qualified service name. The label must be 1-63 characters long, and comply with RFC1035. Specifically, the label must be 1-63 characters long and match the regular expression [a-z]([-a-z0-9]*[a-z0-9])? which means the first character must be a lowercase letter, and all following characters must be a dash, lowercase letter, or digit, except the last character, which cannot be a dash. This field is only used for internal load balancing. This property is in beta, and should be used with the terraform-provider-google-beta provider."
}

##########
# labels #
##########
variable "custom_labels" {
  type        = "map" 
  description = "Custom labels. A set of key/value label pairs to assign to the project."
  default     = {}
}

variable "default_labels" {
  type        = "map" 
  description = "Default labels. A set of key/value label pairs to assign to the project."
  default     = {}
}

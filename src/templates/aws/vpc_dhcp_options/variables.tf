# Define list of variables to be used in main.tf

############
# provider #
############
variable "account_id" {
  description = "Allowed AWS account ID, to prevent you from mistakenly using an incorrect one (and potentially end up destroying a live environment)."
}

variable "region" {
  description = "This is the AWS region."
}

#############
# top level #
#############
variable "vpc_dhcp_options_domain_name" {
  description = "The suffix domain name to use by default when resolving non Fully Qualified Domain Names. In other words, this is what ends up being the search value in the /etc/resolv.conf file."
}

variable "vpc_dhcp_options_domain_name_servers" {
  tyep        = "list"
  description = "List of name servers to configure in /etc/resolv.conf. If you want to use the default AWS nameservers you should set this to AmazonProvidedDNS."
}

variable "vpc_dhcp_options_ntp_servers" {
  tyep        = "list"
  description = "List of NTP servers to configure."
}

variable "vpc_dhcp_options_netbios_name_servers" {
  tyep        = "list"
  description = "List of NETBIOS name servers."
}

variable "vpc_dhcp_options_netbios_node_type" {
  description = "The NetBIOS node type (1, 2, 4, or 8). AWS recommends to specify 2 since broadcast and multicast are not supported in their network. For more information about these node types, see RFC 2132."
}

########
# tags #
########
variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

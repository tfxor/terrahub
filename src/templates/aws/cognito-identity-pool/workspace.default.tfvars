# Specify default values for variables defined in variables.tf

############
# provider #
############
account_id = "600605919324"
region     = "us-east-1"

#############
# top level #
#############
aliases                = []
ordered_cache_behavior = []
comment                = "deep-dev-public-6cd6da8d"
custom_error_response  = []
default_root_object    = "index.html"
enabled                = "true"
is_ipv6_enabled        = "true"
http_version           = "http2"
price_class            = "PriceClass_All"
environment            = "production"

##################
# cache behavior #
##################
allowed_methods        = ["HEAD", "GET"]
cached_methods         = ["HEAD", "GET"]
compress               = "true"
max_ttl                = "604800"
default_ttl            = "604800"
min_ttl                = "86400"
viewer_protocol_policy = "redirect-to-https"
forward_headers                   = []
forward_query_string              = "true"
query_string_cache_keys           = ["_v"]
forward_cookies                   = "all"
forward_cookies_whitelisted_names = []

##################
# logging config #
##################
#log_s3_bucket       = ""
#log_s3_prefix       = ""
#log_include_cookies = "false"

#################
# origin config #
#################
origin_id                = "{{ name }}"
origin_domain_name       = "{{ name }}"
origin_path              = ""
origin_http_port         = "80"
origin_https_port        = "443"
origin_protocol_policy   = "http-only"
origin_ssl_protocols     = ["SSLv3", "TLSv1" ]
origin_keepalive_timeout = "5"
origin_read_timeout      = "30"

################
# restrictions #
################
geo_restriction_type      = "none"
geo_restriction_locations = []

######################
# viewer certificate #
######################
acm_certificate_arn            = ""
ssl_support_method             = "sni-only"
minimum_protocol_version       = "TLSv1"
cloudfront_default_certificate = "true"

########
# tags #
########
default_tags = {
  "ThubName"    = "{{ name }}"
  "ThubCode"    = "06a243bb04be"
  "ThubEnv"     = "default"
  "Description" = "Managed by TerraHub"
  "DeepApplicationId"   = "terrahub-dev-env"
  "DeepApplicationName" = "terrahub-dev-env"
  "DeepDeployId"        = "d6c6b173"
  "DeepEnvironmentId"   = "6cd6da8d"
  "DeepEnvironmentName" = "dev"
}

##########
# custom #
##########

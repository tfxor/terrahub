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

variable "aliases" {
  description = "Extra CNAMEs (alternate domain names), if any, for this distribution."
  type        = "list"
}

variable "cache_behavior" {
  description = "List of cache behaviors to implement"
  type        = "list"
}

variable "comment" {
  description = "Any comments you want to include about the distribution."
  type        = "string"
}

variable "custom_error_response" {
  description = "One or more custom error response elements (multiples allowed)."
  type        = "list"
}

variable "default_root_object" {
  description = "The object that you want CloudFront to return (for example, index.html) when an end user requests the root URL."
  type        = "string"
}

variable "enabled" {
  description = "Whether the distribution is enabled to accept end user requests for content."
  type        = "string"
}

variable "is_ipv6_enabled" {
  description = "Whether the IPv6 is enabled for the distribution."
  type        = "string"
}

variable "http_version" {
  description = "The maximum HTTP version to support on the distribution. Allowed values are http1.1 and http2."
  type        = "string"
}

variable "price_class" {
  description = "The price class for this distribution. One of PriceClass_All, PriceClass_200, PriceClass_100."
  type        = "string"
}

variable "environment" {
  description = "A mapping of tags to assign to the resource."
  type        = "string"
}

##################
# cache behavior #
##################
variable "allowed_methods" {
  description = "Controls which HTTP methods CloudFront processes and forwards to your Amazon S3 bucket or your custom origin."
  type        = "list"
}

variable "cached_methods" {
  description = "Controls whether CloudFront caches the response to requests using the specified HTTP methods."
  type        = "list"
}

variable "compress" {
  description = "Whether you want CloudFront to automatically compress content for web requests that include Accept-Encoding: gzip in the request header (default: false)."
  type        = "string"
}

variable "max_ttl" {
  description = "The maximum amount of time (in seconds) that an object is in a CloudFront cache before CloudFront forwards another request to your origin to determine whether the object has been updated."
  type        = "string"
}

variable "default_ttl" {
  description = "The default amount of time (in seconds) that an object is in a CloudFront cache before CloudFront forwards another request in the absence of an Cache-Control max-age or Expires header."
  type        = "string"
}

variable "min_ttl" {
  description = "The minimum amount of time that you want objects to stay in CloudFront caches before CloudFront queries your origin to see whether the object has been updated."
  type        = "string"
}

variable "viewer_protocol_policy" {
  description = "Use this element to specify the protocol that users can use to access the files in the origin specified by TargetOriginId when a request matches the path pattern in PathPattern."
  type        = "string"
}

variable "forward_headers" {
  description = "Specifies the Headers, if any, that you want CloudFront to vary upon for this cache behavior. Specify `*` to include all headers."
  type        = "list"
}

variable "forward_query_string" {
  description = "Indicates whether you want CloudFront to forward query strings to the origin that is associated with this cache behavior."
  type        = "string"
}

variable "forward_cookies" {
  description = "Specifies whether you want CloudFront to forward cookies to the origin. Valid options are all, none or whitelist."
  type        = "string"
}

variable "forward_cookies_whitelisted_names" {
  description = "If you have specified whitelist to forward, the whitelisted cookies that you want CloudFront to forward to your origin."
  type        = "list"
}

##################
# logging config #
##################
#variable "log_s3_bucket" {
#  description = "(Required) The Amazon S3 bucket to store the access logs in."
#  type        = "string"
#}

#variable "log_s3_prefix" {
#  description = "An optional string that you want CloudFront to prefix to the access log filenames for this distribution, for example, myprefix/."
#  type        = "string"
#}

#variable "log_include_cookies" {
#  description = "Specifies whether you want CloudFront to include cookies in access logs."
#  type        = "string"
#}

#################
# origin config #
#################
variable "origin_domain_name" {
  description = "The DNS domain name of your custom origin (e.g. website)."
  type        = "string"
}

variable "origin_id" {
  description = "(Required) A unique identifier for the origin."
  type        = "string"
}

variable "origin_path" {
  description = "An optional element that causes CloudFront to request your content from a directory in your Amazon S3 bucket or your custom origin."
  type        = "string"
}

variable "origin_http_port" {
  description = "The HTTP port the custom origin listens on."
  type        = "string"
}

variable "origin_https_port" {
  description = "The HTTPS port the custom origin listens on."
  type        = "string"
}

variable "origin_protocol_policy" {
  description = "The origin protocol policy to apply to your origin. One of http-only, https-only, or match-viewer."
  type        = "string"
}

variable "origin_ssl_protocols" {
  description = "The SSL/TLS protocols that you want CloudFront to use when communicating with your origin over HTTPS."
  type        = "list"
}

variable "origin_keepalive_timeout" {
  description = "The Custom KeepAlive timeout, in seconds. By default, AWS enforces a limit of 60. But you can request an increase."
  type        = "string"
}

variable "origin_read_timeout" {
  description = "The Custom Read timeout, in seconds. By default, AWS enforces a limit of 60. But you can request an increase."
  type        = "string"
}

################
# restrictions #
################
variable "geo_restriction_type" {
  description = "The method that you want to use to restrict distribution of your content by country: none, whitelist, or blacklist."
  type        = "string"
}

variable "geo_restriction_locations" {
  description = "The ISO 3166-1-alpha-2 codes for which you want CloudFront either to distribute your content (whitelist) or not distribute your content (blacklist)."
  type        = "list"
}

######################
# viewer certificate #
######################
variable "acm_certificate_arn" {
  description = "Existing ACM Certificate ARN."
  type        = "string"
}

variable "ssl_support_method" {
  description = "Specifies how you want CloudFront to serve HTTPS requests."
  type        = "string"
}

variable "minimum_protocol_version" {
  description = "The minimum version of the SSL protocol that you want CloudFront to use for HTTPS connections."
  type        = "string"
}

variable "cloudfront_default_certificate" {
  description = "true if you want viewers to use HTTPS to request your objects and you're using the CloudFront domain name for your distribution."
  type        = "string"
}

########
# tags #
########
variable "cloudfront_tag_name" {
  description = "The tag that will be applied to cloud resource."
  type        = "string"
}

variable "cloudfront_tag_description" {
  description = "The tag that will be applied to cloud resource."
  type        = "string"
}

variable "cloudfront_tag_environment" {
  description = "The tag that will be applied to cloud resource."
  type        = "string"
}

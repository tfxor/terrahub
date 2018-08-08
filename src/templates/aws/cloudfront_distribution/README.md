# aws_cloudfront_distribution

Creates an Amazon CloudFront web distribution.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|aliases|Extra CNAMEs (alternate domain names), if any, for this distribution.|list|[]|No|
|ordered_cache_behavior|List of cache behaviors to implement.|list|[]|No|
|comment|Any comments you want to include about the distribution.|string||No|
|custom_error_response|One or more custom error response elements (multiples allowed).|list|[]|No|
|default_root_object|The object that you want CloudFront to return (for example, index.html) when an end user requests the root URL.|string|index.html|No|
|enabled|Whether the distribution is enabled to accept end user requests for content.|string|true|No|
|is_ipv6_enabled|Whether the IPv6 is enabled for the distribution.|string|true|No|
|http_version|The maximum HTTP version to support on the distribution. Allowed values are http1.1 and http2.|string|http2|No|
|price_class|The price class for this distribution. One of PriceClass_All, PriceClass_200, PriceClass_100.|string|PriceClass_200|No|
|environment|A mapping of tags to assign to the resource.|string|production|No|
|allowed_methods|Controls which HTTP methods CloudFront processes and forwards to your Amazon S3 bucket or your custom origin.|list|["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]|No|
|cached_methods|Controls whether CloudFront caches the response to requests using the specified HTTP methods.|list|["GET", "HEAD"]|No|
|compress|Whether you want CloudFront to automatically compress content for web requests that include Accept-Encoding: gzip in the request header (default: false).|string|false|No|
|default_ttl|The default amount of time (in seconds) that an object is in a CloudFront cache before CloudFront forwards another request in the absence of an Cache-Control max-age or Expires header.|string|60|No|
|max_ttl|The maximum amount of time (in seconds) that an object is in a CloudFront cache before CloudFront forwards another request to your origin to determine whether the object has been updated.|string|86400|No|
|min_ttl|The minimum amount of time that you want objects to stay in CloudFront caches before CloudFront queries your origin to see whether the object has been updated.|string|0|No|
|viewer_protocol_policy|Use this element to specify the protocol that users can use to access the files in the origin specified by TargetOriginId when a request matches the path pattern in PathPattern.|string|allow-all|No|
|forward_headers|Specifies the Headers, if any, that you want CloudFront to vary upon for this cache behavior. Specify `*` to include all headers.|list|[]|No|
|forward_query_string|Indicates whether you want CloudFront to forward query strings to the origin that is associated with this cache behavior.|string|false|No|
|forward_cookies|Specifies whether you want CloudFront to forward cookies to the origin. Valid options are all, none or whitelist.|string|none|No|
|forward_cookies_whitelisted_names|If you have specified whitelist to forward, the whitelisted cookies that you want CloudFront to forward to your origin.|list|[]|No|
|log_include_cookies|Specifies whether you want CloudFront to include cookies in access logs.|string|false|No|
|log_bucket|The Amazon S3 bucket to store the access logs in.|string||Yes|
|log_prefix|An optional string that you want CloudFront to prefix to the access log filenames for this distribution, for example, myprefix/.|string||No|
|origin_domain_name|The DNS domain name of your custom origin (e.g. website).|string||No|
|origin_id|A unique identifier for the origin.|string||Yes|
|origin_path|An optional element that causes CloudFront to request your content from a directory in your Amazon S3 bucket or your custom origin.|string||No|
|origin_http_port|The HTTP port the custom origin listens on.|string|80|No|
|origin_https_port|The HTTPS port the custom origin listens on.|string|443|No|
|origin_protocol_policy|The origin protocol policy to apply to your origin. One of http-only, https-only, or match-viewer.|string|allow-all|No|
|origin_ssl_protocols|The SSL/TLS protocols that you want CloudFront to use when communicating with your origin over HTTPS.|list|["TLSv1", "TLSv1.1", "TLSv1.2"]|No|
|origin_keepalive_timeout|The Custom KeepAlive timeout, in seconds. By default, AWS enforces a limit of 60. But you can request an increase.|string|60|No|
|origin_read_timeout|The Custom Read timeout, in seconds. By default, AWS enforces a limit of 60. But you can request an increase.|string|60|No|
|geo_restriction_type|The method that you want to use to restrict distribution of your content by country: none, whitelist, or blacklist.|string|whitelist|No|
|geo_restriction_locations|The ISO 3166-1-alpha-2 codes for which you want CloudFront either to distribute your content (whitelist) or not distribute your content (blacklist).|list|["US", "CA", "GB", "DE"]|No|
|acm_certificate_arn|Existing ACM Certificate ARN.|string||No|
|ssl_support_method|Specifies how you want CloudFront to serve HTTPS requests.|string|sni-only|No|
|minimum_protocol_version|The minimum version of the SSL protocol that you want CloudFront to use for HTTPS connections.|string|TLSv1|No|
|cloudfront_default_certificate|true if you want viewers to use HTTPS to request your objects and you're using the CloudFront domain name for your distribution.|string|false|No|\
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The identifier for the distribution. For example: EDFDVBD632BHDS5.|string|
|thub_id|The identifier for the distribution. For example: EDFDVBD632BHDS5 (hotfix for issue hashicorp/terraform#[7982]).|string|
|arn|The ARN (Amazon Resource Name) for the distribution. For example: arn:aws:cloudfront::123456789012:distribution/EDFDVBD632BHDS5, where 123456789012 is your AWS account ID.|string|
|aliases|Extra CNAMEs (alternate domain names), if any, for this distribution.|list|
|status|The current status of the distribution. Deployed if the distribution's information is fully propagated throughout the Amazon CloudFront system.|string|
|domain_name|The domain name corresponding to the distribution. For example: d604721fxaaqy9.cloudfront.net.|string|
|etag|The current version of the distribution's information. For example: E2QWRUHAPOMQZL.|string|
|hosted_zone_id|The CloudFront Route 53 zone ID that can be used to route an Alias Resource Record Set to. This attribute is simply an alias for the zone ID Z2FDTNDATAQYW2.|string|
|last_modified_time|The date and time the distribution was last modified.|string|
|in_progress_validation_batches|The number of invalidation batches currently in progress.|string|
|caller_reference|Internal value used by CloudFront to allow future updates to the distribution configuration.|string|
|active_trusted_signers|The key pair IDs that CloudFront is aware of for each trusted signer, if the distribution is set up to serve private content with signed URLs.|string|

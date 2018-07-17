# aws_s3_bucket

Creates a S3 bucket resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|s3_bucket_name|The name of the bucket.|string||Yes|
|s3_bucket_acl|The canned ACL to apply.|string|private|No|
|s3_bucket_region|The AWS region this bucket should reside in.|string||Yes|
|s3_bucket_force_destroy|A boolean that indicates all objects should be deleted from the bucket so that the bucket can be destroyed without error.|string|false|No|
|s3_bucket_cors_rule_allowed_headers|Specifies which headers are allowed.|list|["*"]|No|
|s3_bucket_cors_rule_allowed_methods|Specifies which methods are allowed. Can be GET, PUT, POST, DELETE or HEAD.|list|["PUT","POST"]|No|
|s3_bucket_cors_rule_allowed_origins|Specifies which origins are allowed.|list|["*"]|No|
|s3_bucket_cors_rule_expose_headers|Specifies which origins are allowed.|list|["ETag"]|No|
|s3_bucket_cors_rule_max_age_seconds|Specifies time in seconds that browser can cache the response for a preflight request.|string|"3000"|No|
|s3_bucket_versioning_enabled|Enable versioning. Once you version-enable a bucket, it can never return to an unversioned state. You can, however, suspend versioning on that bucket.|string|false|No|
|s3_bucket_versioning_mfa_delete|Enable MFA delete for either Change the versioning state of your bucket or Permanently delete an object version.|string|false|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|s3_id|The name of the bucket.|string|
|s3_arn|The ARN of the bucket. Will be of format arn:aws:s3:::bucketname.|string|
|s3_bucket_domain_name|The bucket domain name. Will be of format bucketname.s3.amazonaws.com.|string|
|s3_hosted_zone_id|The Route 53 Hosted Zone ID for this bucket's region.|string|
|s3_region|The AWS region this bucket resides in.|string|

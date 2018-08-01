# aws_acm_certificate

The ACM certificate resource allows requesting and management of certificates from the Amazon Certificate Manager.

It deals with requesting certificates and managing their attributes and life-cycle. This resource does not deal with validation of a certificate but can provide inputs for other resources implementing the validation. It does not wait for a certificate to be issued. Use a aws_acm_certificate_validation resource for this.

Most commonly, this resource is used to together with aws_route53_record and aws_acm_certificate_validation to request a DNS validated certificate, deploy the required validation records and wait for validation to complete.

Domain validation through E-Mail is also supported but should be avoided as it requires a manual step outside of Terraform.

It's recommended to specify create_before_destroy = true in a lifecycle block to replace a certificate which is currently in use (eg, by aws_lb_listener).

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|acm_certificate_domain_name|A domain name for which the certificate should be issued.|string|{{ name }}.com|No|
|acm_certificate_validation_method|Which method to use for validation. DNS or EMAIL are valid, NONE can be used for certificates that were imported into ACM and then into Terraform.|string|DNS|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ARN of the certificate|string|
|arn|The ARN of the certificate|string|
|domain_validation_options|A list of attributes to feed into other resources to complete certificate validation. Can have more than one element, e.g. if SANs are defined. Only set if DNS-validation was used.|string|
|validation_emails|A list of addresses that received a validation E-Mail. Only set if EMAIL-validation was used.|string|
|domain_name|The domain to be validated|string|
|resource_record_name|The name of the DNS record to create to validate the certificate|string|
|resource_record_type|The type of DNS record to create|string|
|resource_record_value|The value the DNS record needs to have|string|
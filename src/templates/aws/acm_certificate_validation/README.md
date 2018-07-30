# aws_acm_certificate_validation

This resource represents a successful validation of an ACM certificate in concert with other resources.

Most commonly, this resource is used together with aws_route53_record and aws_acm_certificate to request a DNS validated certificate, deploy the required validation records and wait for validation to complete.

WARNING: This resource implements a part of the validation workflow. It does not represent a real-world entity in AWS, therefore changing or deleting this resource on its own has no immediate effect.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|acm_certificate_validation_arn|The ARN of the certificate that is being validated.|string||Yes|
|acm_certificate_validation_record_fqdns|List of FQDNs that implement the validation. Only valid for DNS validation method ACM certificates. If this is set, the resource can implement additional sanity checks and has an explicit dependency on the resource that is implementing the validation.|list||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
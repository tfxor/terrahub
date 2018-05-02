# route53_record

Provides a Route53 record resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|route53_record_zone_id|The ID of the hosted zone to contain this record.|string||Yes|
|route53_record_name|The name of the record.|string|www|No|
|route53_record_type|The record type. Valid values are A, AAAA, CAA, CNAME, MX, NAPTR, NS, PTR, SOA, SPF, SRV and TXT.|string|CNAME|No|
|route53_record_ttl|The TTL of the record.|string|300|No|
|route53_record_records|A string list of records. To specify a single record value longer than 255 characters such as a TXT record for DKIM.|array|dev.example.com|No|
|route53_record_allow_overwrite|Allow creation of this record in Terraform to overwrite an existing record, if any. This does not prevent other resources within Terraform or manual Route53 changes from overwriting this record.|string|true|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|route53_record_fqdn|This is the name of the hosted zone.|string|
|route53_record_name|The name of the record.|string|
|route53_record_type|The record type. Valid values are A, AAAA, CAA, CNAME, MX, NAPTR, NS, PTR, SOA, SPF, SRV and TXT.|string|
|route53_record_records|A string list of records. To specify a single record value longer than 255 characters such as a TXT record for DKIM.|array|

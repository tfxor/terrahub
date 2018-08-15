# aws_vpc_endpoint_service_allowed_principal

Provides a resource to allow a principal to discover a VPC endpoint service.

NOTE on VPC Endpoint Services and VPC Endpoint Service Allowed Principals: Terraform provides both a standalone VPC Endpoint Service Allowed Principal resource and a VPC Endpoint Service resource with an allowed_principals attribute. Do not use the same principal ARN in both a VPC Endpoint Service resource and a VPC Endpoint Service Allowed Principal resource. Doing so will cause a conflict and will overwrite the association.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|vpc_endpoint_vpc_endpoint_service_id|The ID of the VPC endpoint service to allow permission.|string||Yes|
|vpc_endpoint_principal_arn|The ARN of the principal to allow permissions.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the association.|string|
|thub_id|The ID of the association (hotfix for issue hashicorp/terraform#[7982]).|string|

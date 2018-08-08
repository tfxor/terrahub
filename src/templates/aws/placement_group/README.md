# aws_placement_group

Provides an EC2 placement group. Read more about placement groups in AWS Docs.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|placement_group_name|The name of the placement group.|string|{{ name }}|No|
|placement_group_strategy|The placement strategy.|string|cluster|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The name of the placement group.|string|
|thub_id|The name of the placement group (hotfix for issue hashicorp/terraform#[7982]).|string|

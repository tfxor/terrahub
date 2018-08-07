# api_gateway_usage_plan

Provides an API Gateway Usage Plan.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|gateway_usage_plan_description|The description of a usage plan.|string|Managed by TerraHub|No|
|gateway_usage_plan_product_code|The AWS Markeplace product identifier to associate with the usage plan as a SaaS product on AWS Marketplace.|string|MYCODE|No|
|gateway_usage_plan_api_id|API Id of the associated API stage in a usage plan.|string||Yes|
|gateway_usage_plan_stage|API stage name of the associated API stage in a usage plan.|string||Yes|
|gateway_usage_plan_limit|The maximum number of requests that can be made in a given time period.|string|20|No|
|gateway_usage_plan_offset|The number of requests subtracted from the given limit in the initial time period.|string|2|No|
|gateway_usage_plan_period|The time period in which the limit applies. Valid values are "DAY", "WEEK" or "MONTH".|string|WEEK|No|
|gateway_usage_plan_burst_limit|The API request burst limit, the maximum rate limit over a time ranging from one to a few seconds, depending upon whether the underlying token bucket is at its full capacity.|string|5|No|
|gateway_usage_plan_rate_limit|The API request steady-state rate limit.|string|10|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the API resource.|string|
|thub_id|The ID of the API resource (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|
|name|The name of the usage plan.|string|
|description|The description of a usage plan.|string|
|api_stages|The associated API stages of the usage plan.|array|
|quota_settings|The quota of the usage plan.|array|
|throttle_settings|The quota of the usage plan.|array|
|product_code|The AWS Markeplace product identifier to associate with the usage plan as a SaaS product on AWS Marketplace.|string|

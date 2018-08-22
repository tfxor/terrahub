# aws_ssm_parameter

Provides an SSM Parameter resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|ssm_parameter_name|The name of the parameter.|string|{{ name }}|No|
|ssm_parameter_description|The description of the parameter.|string|Managed by TerraHub|No|
|ssm_parameter_type|The type of the parameter. Valid types are String, StringList and SecureString.|string|SecureString|No|
|ssm_parameter_key_id|The KMS key id or arn for encrypting a SecureString.|string||Yes|
|ssm_parameter_value|The value of the parameter.|string||Yes|
|overwrite|Overwrite an existing parameter. If not specified, will default to false if the resource has not been created by terraform to avoid overwrite of existing resource and will default to true otherwise (terraform lifecycle rules should then be used to manage the update behavior).|boolean|true|No|
|ssm_parameter_allowed_pattern|A regular expression used to validate the parameter value.|string||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|arn|The ARN of the parameter.|string|
|name|The name of the parameter.|string|
|description|The description of the parameter.|string|
|type|The type of the parameter. Valid types are String, StringList and SecureString.|string|
|value|The value of the parameter.|string|

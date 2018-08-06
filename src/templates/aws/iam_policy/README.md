# aws_iam_policy

Create an IAM policy.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|iam_policy_name|The name of policy.|string||Yes|
|iam_policy_path|The path of policy.|string|/|No|
|iam_policy_sid|The sid of policy.|string|default|No|
|iam_policy_actions|A list of actions, separate with ','.|string|lambda:*|No|
|iam_policy_resources|A list of resources, separate with ','.|string|*|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The policy's ID.|int|
|thub_id|The policy's ID.|int|
|arn|The ARN assigned by AWS to this policy.|string|
|name|The name of the policy.|int|
|path|The path of the policy.|int|
|policy|The policy of the policy.|int|

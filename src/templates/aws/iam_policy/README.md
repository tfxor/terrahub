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
|aws_iam_policy_id|The policy's ID.|int|
|aws_iam_policy_arn|The ARN assigned by AWS to this policy.|string|
|aws_iam_policy_name|The name of the policy.|int|
|aws_iam_policy_path|The path of the policy.|int|
|aws_iam_policy_policy|The policy of the policy.|int|

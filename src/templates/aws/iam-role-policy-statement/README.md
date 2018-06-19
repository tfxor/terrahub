# aws_iam_role and aws_iam_policy

Create an IAM role and policy.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This id of AWS region.|string||Yes|
|role_name|The name of the role. If omitted, Terraform will assign a random, unique name.|string|defaul-test-role|No|
|policy_name|The name of policy.|string|defaul-test-policy|No|

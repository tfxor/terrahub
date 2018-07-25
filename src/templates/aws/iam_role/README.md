# aws_iam_role

Create an IAM role.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|iam_role_name|The name of the role. If omitted, Terraform will assign a random, unique name.|string||No|
|iam_role_force_detach_policies|Specifies to force detaching any policies the role has before destroying it. Defaults to false.|string|false|No|
|iam_role_description|The description of the role.|string|[]|No|
|iam_role_policy_sid|An ID for the policy statement.|string|1|No|
|iam_role_policy_actions|A list of actions that this statement either allows or denies.|list|[]|No|
|iam_role_policy_effect|Either Allow or Deny, to specify whether this statement allows or denies the given actions.|string|Allow|No|
|iam_role_policy_principals_type|The type of principal. For AWS accounts this is AWS.|string|AWS|No|
|iam_role_policy_principals_identifiers|List of identifiers for principals. When type is AWS, these are IAM user or role ARNs.|list|[]|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|iam_arn|The Amazon Resource Name (ARN) specifying the role.|string|
|iam_create_date|The creation date of the IAM role.|string|
|iam_unique_id|The stable and unique string identifying the role.|string|
|iam_name|The name of the role.|string|
|iam_description|The description of the role.|string|

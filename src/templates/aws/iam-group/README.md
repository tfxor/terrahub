# iam_group

Provides an IAM group.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|iam_group_name|The group's name. The name must consist of upper and lowercase alphanumeric characters with no spaces. You can also include any of the following characters: =,.@-_.. group names are not distinguished by case.|string|{{ name }}|No|
|iam_group_path|Path in which to create the group.|string|/|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|iam_group_id|The group's ID.|string|
|iam_group_arn|The ARN assigned by AWS for this group.|string|
|iam_group_name|The group's name.|string|
|iam_group_path|The path of the group in IAM.|string|
|iam_group_unique_id|The unique ID assigned by AWS.|string|

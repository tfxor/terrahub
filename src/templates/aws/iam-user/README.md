# iam_user

Provides an IAM user.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|iam_user_name|The user's name. The name must consist of upper and lowercase alphanumeric characters with no spaces. You can also include any of the following characters: =,.@-_.. User names are not distinguished by case.|string|{{ name }}|No|
|iam_user_path|Path in which to create the user.|string|/system/|No|
|iam_user_force_destroy|When destroying this user, destroy even if it has non-Terraform-managed IAM access keys, login profile or MFA devices. Without force_destroy a user with non-Terraform-managed access keys and login profile will fail to be destroyed.|boolean|false|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|iam_user_arn|The ARN assigned by AWS for this user.|string|
|iam_user_name|The user's name.|string|
|iam_user_unique_id|The unique ID assigned by AWS.|string|

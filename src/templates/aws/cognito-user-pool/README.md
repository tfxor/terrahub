# cognito_user_pool

Provides a Cognito User Pool resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|cognito_user_pool_name|The name of the user pool.|string|{{ name }}|No|
|cognito_user_pool_mfa_configuration|Set to enable multi-factor authentication. Must be one of the following values (ON, OFF, OPTIONAL)|string|OFF|No|
|cognito_user_pool_minimum_length|The minimum length of the password policy that you have set.|string|8|No|
|cognito_user_pool_require_lowercase|Whether you have required users to use at least one lowercase letter in their password.|boolean|true|No|
|cognito_user_pool_require_numbers|Whether you have required users to use at least one number in their password.|boolean|true|No|
|cognito_user_pool_require_symbols|Whether you have required users to use at least one symbol in their password.|boolean|true|No|
|cognito_user_pool_require_uppercase|Whether you have required users to use at least one uppercase letter in their password.|boolean|true|No|
|cognito_user_pool_allow_admin_create_user_only|Set to True if only the administrator is allowed to create user profiles. Set to False if users can sign themselves up via an app.|boolean|false|No|
|cognito_user_pool_unused_account_validity_days|The user account expiration limit, in days, after which the account is no longer usable.|string|7|No|
|cognito_user_pool_tag_name|A name tag to assign to the resource.|string|{{ name }}|No|
|cognito_user_pool_tag_description|A description tag to assign to the resource.|string|Managed by Terraform Plus|No|
|cognito_user_pool_tag_environment|A environment tag to assign to the resource.|string|default|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|cognito_user_pool_name|The name of the user pool.|string|
|cognito_user_pool_id|The id of the user pool.|string|
|cognito_user_pool_arn|The ARN of the user pool.|string|
|cognito_user_pool_creation_date|The date the user pool was created.|string|
|cognito_user_pool_last_modified_date|The date the user pool was last modified.|string|

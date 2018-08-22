# aws_codebuild_project

Provides a CodeBuild Project resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|codebuild_project_name|The projects name.|string|{{ name }}|No|
|codebuild_project_badge_enabled|Generates a publicly-accessible URL for the projects build badge. Available as badge_url attribute when enabled.|string||Yes|
|codebuild_project_build_timeout|How long in minutes, from 5 to 480 (8 hours), for AWS CodeBuild to wait until timing out any related build that does not get marked as completed.|string|5|No|
|codebuild_project_description|A short description of the project.|string|Managed by TerraHub|No|
|codebuild_project_service_role|The Amazon Resource Name (ARN) of the AWS Identity and Access Management (IAM) role that enables AWS CodeBuild to interact with dependent AWS services on behalf of the AWS account.|string||Yes|
|codebuild_project_artifacts_type|The build output artifact's type. Valid values for this parameter are: CODEPIPELINE, NO_ARTIFACTS or S3.|string|NO_ARTIFACTS|No|
|codebuild_project_artifacts_name|The name of the project. If type is set to S3, this is the name of the output artifact object.|string|artifact_{{ name }}|No|
|codebuild_project_artifacts_namespace_type|The namespace to use in storing build artifacts. If type is set to S3, then valid values for this parameter are: BUILD_ID or NONE.|string|NONE|No|
|codebuild_project_artifacts_packaging|The type of build output artifact to create. If type is set to S3, valid values for this parameter are: NONE or ZIP|string|NONE|No|
|codebuild_project_environment_compute_type|Information about the compute resources the build project will use. Available values for this parameter are: BUILD_GENERAL1_SMALL, BUILD_GENERAL1_MEDIUM or BUILD_GENERAL1_LARGE. BUILD_GENERAL1_SMALL is only valid if type is set to LINUX_CONTAINER.|string|BUILD_GENERAL1_SMALL|No|
|codebuild_project_environment_image|The image identifier of the Docker image to use for this build project (list of Docker images provided by AWS CodeBuild.). You can read more about the AWS curated environment images in the documentation.|string|aws/codebuild/nodejs:6.3.1|No|
|codebuild_project_environment_type|The type of build environment to use for related builds. Available values are: LINUX_CONTAINER or WINDOWS_CONTAINER.|string|LINUX_CONTAINER|No|
|codebuild_project_environment_variable|A set of environment variables to make available to builds for this build project.|map|{"name"  = "SOME_KEY2" "value" = "SOME_VALUE2" "type"  = "PARAMETER_STORE"}|No|
|codebuild_project_environment_privileged_mode|If set to true, enables running the Docker daemon inside a Docker container.|boolean|false|No|
|codebuild_project_source_type|The type of repository that contains the source code to be built. Valid values for this parameter are: CODECOMMIT, CODEPIPELINE, GITHUB, GITHUB_ENTERPRISE, BITBUCKET or S3.|string|GITHUB|No|
|codebuild_project_source_location|The location of the source code from git or s3.|string||Yes|
|codebuild_project_source_git_clone_depth|Truncate git history to this many commits.|number|1|No|
|codebuild_project_cache_type|The type of storage that will be used for the AWS CodeBuild project cache. Valid values: NO_CACHE and S3.|string|S3|No|
|codebuild_project_cache_location|The location where the AWS CodeBuild project stores cached resources. For type S3 the value must be a valid S3 bucket name/prefix.|string||Yes|
|codebuild_project_vpc_config_vpc_id|The security group IDs to assign to running builds.|string||Yes|
|codebuild_project_vpc_config_subnets|The subnet IDs within which to run builds.|list||Yes|
|codebuild_project_vpc_config_security_group_ids|The security group IDs to assign to running builds.|list||Yes|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ARN of the CodeBuild project.|string|
|thub_id|The ARN of the CodeBuild project (hotfix for issue hashicorp/terraform#[7982]).|string|
|badge_url|The URL of the build badge when badge_enabled is enabled.|string|

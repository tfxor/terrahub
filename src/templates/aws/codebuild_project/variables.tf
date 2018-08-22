# Define list of variables to be used in main.tf

############
# provider #
############
variable "account_id" {
  description = "Allowed AWS account ID, to prevent you from mistakenly using an incorrect one (and potentially end up destroying a live environment)."
}

variable "region" {
  description = "This is the AWS region."
}

#############
# top level #
#############
variable "codebuild_project_name" {
  description = "The projects name."
}

variable "codebuild_project_badge_enabled" {
  description = "Generates a publicly-accessible URL for the projects build badge. Available as badge_url attribute when enabled."
}

variable "codebuild_project_build_timeout" {
  description = "How long in minutes, from 5 to 480 (8 hours), for AWS CodeBuild to wait until timing out any related build that does not get marked as completed."
}

variable "codebuild_project_description" {
  description = "A short description of the project."
}

variable "codebuild_project_service_role" {
  description = "The Amazon Resource Name (ARN) of the AWS Identity and Access Management (IAM) role that enables AWS CodeBuild to interact with dependent AWS services on behalf of the AWS account."
}

#############
# artifacts #
#############
variable "codebuild_project_artifacts_type" {
  description = "The build output artifact's type. Valid values for this parameter are: CODEPIPELINE, NO_ARTIFACTS or S3."
}

variable "codebuild_project_artifacts_name" {
  description = "The name of the project. If type is set to S3, this is the name of the output artifact object."
}

variable "codebuild_project_artifacts_namespace_type" {
  description = "The namespace to use in storing build artifacts. If type is set to S3, then valid values for this parameter are: BUILD_ID or NONE."
}

variable "codebuild_project_artifacts_packaging" {
  description = "The type of build output artifact to create. If type is set to S3, valid values for this parameter are: NONE or ZIP."
}

###############
# environment #
###############
variable "codebuild_project_environment_compute_type" {
  description = "Information about the compute resources the build project will use. Available values for this parameter are: BUILD_GENERAL1_SMALL, BUILD_GENERAL1_MEDIUM or BUILD_GENERAL1_LARGE. BUILD_GENERAL1_SMALL is only valid if type is set to LINUX_CONTAINER."
}

variable "codebuild_project_environment_image" {
  description = "The image identifier of the Docker image to use for this build project (list of Docker images provided by AWS CodeBuild.). You can read more about the AWS curated environment images in the documentation."
}

variable "codebuild_project_environment_type" {
  description = "The type of build environment to use for related builds. Available values are: LINUX_CONTAINER or WINDOWS_CONTAINER."
}

variable "codebuild_project_environment_variables" {
  type        = "map"
  description = "A set of environment variables to make available to builds for this build project."
  default     = {}
}

variable "codebuild_project_environment_privileged_mode" {
  description = "If set to true, enables running the Docker daemon inside a Docker container."
}

##########
# source #
##########
variable "codebuild_project_source_type" {
  description = "The type of repository that contains the source code to be built. Valid values for this parameter are: CODECOMMIT, CODEPIPELINE, GITHUB, GITHUB_ENTERPRISE, BITBUCKET or S3."
}

variable "codebuild_project_source_location" {
  description = "The location of the source code from git or s3."
}

variable "codebuild_project_source_git_clone_depth" {
  description = "Truncate git history to this many commits."
}

#########
# cache #
#########
variable "codebuild_project_cache_type" {
  description = "The type of storage that will be used for the AWS CodeBuild project cache. Valid values: NO_CACHE and S3."
}

variable "codebuild_project_cache_location" {
  description = "The location where the AWS CodeBuild project stores cached resources. For type S3 the value must be a valid S3 bucket name/prefix."
}

##############
# vpc_config #
##############
variable "codebuild_project_vpc_config_vpc_id" {
  description = "The security group IDs to assign to running builds."
}

variable "codebuild_project_vpc_config_subnets" {
  type        = "list"
  description = "The subnet IDs within which to run builds."
}

variable "codebuild_project_vpc_config_security_group_ids" {
  type        = "list"
  description = "The security group IDs to assign to running builds."
}

########
# tags #
########
variable "custom_tags" {
  type        = "map"
  description = "Custom tags"
  default     = {}
}

variable "default_tags" {
  type        = "map"
  description = "Default tags"
  default     = {}
}

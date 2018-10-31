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
variable "codepipeline_name" {
  description = "The name of the pipeline."
}

variable "codepipeline_role_name" {
  description = "A service role Amazon Resource Name that grants AWS CodePipeline permission to make calls to AWS services on your behalf."
}

##################
# artifact store #
##################
variable "codepipeline_artifact_store_location" {
  description = "The location where AWS CodePipeline stores artifacts for a pipeline, such as an S3 bucket."
}

variable "codepipeline_artifact_store_type" {
  description = "The type of the artifact store, such as Amazon S3."
}

variable "codepipeline_artifact_store_encryption_key_id" {
  description = "The KMS key ARN or ID."
}

variable "codepipeline_artifact_store_encryption_key_type" {
  description = "The type of key; currently only KMS is supported"
}

############
# stage 01 #
############
variable "codepipeline_stage_01_name" {
  description = "The name of the stage 01."
}

variable "codepipeline_stage_01_action_default" {
  type        = "list"
  description = "The action(s) to include in the stage."
  default     = []
}

variable "codepipeline_stage_01_action_custom" {
  type        = "list"
  description = "The action(s) to include in the stage."
  default     = []
}

############
# stage 02 #
############
variable "codepipeline_stage_02_name" {
  description = "The name of the stage 02."
}

variable "codepipeline_stage_02_action_default" {
  type        = "list"
  description = "The action(s) to include in the stage."
  default     = []
}

variable "codepipeline_stage_02_action_custom" {
  type        = "list"
  description = "The action(s) to include in the stage."
  default     = []
}

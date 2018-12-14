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
variable "glue_job_name" {
  description = "The name you assign to this job. It must be unique in your account."
}

variable "glue_job_iam_role_name" {
  description = "The NAME of the IAM role associated with this job."
}

variable "glue_job_description" {
  description = "Description of the job."
}

variable "glue_job_connections" {
  type        = "list"
  description = "The list of connections used for this job."
}

variable "glue_job_allocated_capacity" {
  description = "The number of AWS Glue data processing units (DPUs) to allocate to this Job. At least 2 DPUs need to be allocated; the default is 10. A DPU is a relative measure of processing power that consists of 4 vCPUs of compute capacity and 16 GB of memory."
}

variable "glue_job_timeout" {
  description = "The job timeout in minutes."
}

variable "glue_job_default_arguments" {
  type        = "map"
  description = "The map of default arguments for this job. You can specify arguments here that your own job-execution script consumes, as well as arguments that AWS Glue itself consumes. For information about how to specify and consume your own Job arguments, see the Calling AWS Glue APIs in Python topic in the developer guide. For information about the key-value pairs that AWS Glue consumes to set up your job, see the Special Parameters Used by AWS Glue topic in the developer guide."
}

###########
# command #
###########
variable "glue_job_command_script_name" {
  description = "The name of the job command. Defaults to glueetl"
}

variable "glue_job_command_script_location_path" {
  description = "Specifies the S3 path to a script that executes a job."
}

variable "glue_job_command_script_file_name" {
  description = "Specifies the file name to a script that executes a job."
}

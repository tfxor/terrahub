# aws_codebuild_webhook

Manages a CodeBuild webhook, which is an endpoint accepted by the CodeBuild service to trigger builds from source code repositories. Depending on the source type of the CodeBuild project, the CodeBuild service may also automatically create and delete the actual repository webhook as well.

» Example Usage
» GitHub
When working with GitHub source CodeBuild webhooks, the CodeBuild service will automatically create (on aws_codebuild_webhook resource creation) and delete (on aws_codebuild_webhook resource deletion) the GitHub repository webhook using its granted OAuth permissions. This behavior cannot be controlled by Terraform.

Note: The AWS account that Terraform uses to create this resource must have authorized CodeBuild to access GitHub's OAuth API in each applicable region. This is a manual step that must be done before creating webhooks with this resource. If OAuth is not configured, AWS will return an error similar to ResourceNotFoundException: Could not find access token for server type github. More information can be found in the CodeBuild User Guide.

Note: Further managing the automatically created GitHub webhook with the github_repository_webhook resource is only possible with importing that resource after creation of the aws_codebuild_webhook resource. The CodeBuild API does not ever provide the secret attribute for the aws_codebuild_webhook resource in this scenario.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|codebuild_webhook_project_name||string||Yes|
|codebuild_webhook_branch_filter||string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The name of the build project.|string|
|thub_id|The name of the build project (hotfix for issue hashicorp/terraform#[7982]).|string|
|payload_url|The CodeBuild endpoint where webhook events are sent.|string|
|secret|The secret token of the associated repository. Not returned by the CodeBuild API for all source types.|string|
|url|The URL to the webhook.|string|

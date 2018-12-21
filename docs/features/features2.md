# Feature \#2

## Simplify and distribute the way terraform configuration is executed

```text
$ terrahub init
💡 [s3-bucket] terraform init -no-color .
[s3-bucket] Initializing provider plugins...
- Checking for available provider plugins on https://releases.hashicorp.com...
[s3-bucket] - Downloading plugin for provider "aws" (1.21.0)...
[s3-bucket] Terraform has been successfully initialized!
[...]
✅ Done

$ terrahub plan
💡 [s3-bucket] terraform plan -no-color -var-file=./s3-bucket/default.tfvars -out=s3-bucket/.terraform/terraform.tfplan
[s3-bucket] Refreshing Terraform state in-memory prior to plan...
[s3-bucket] The refreshed state will be used to calculate this plan, but will not be
persisted to local or remote state storage.
[...]
✅ Done

$ terrahub apply --auto-approve
💡 [s3-bucket] terraform apply -no-color -var-file=./s3-bucket/default.tfvars -auto-approve=true -state-out=./s3-bucket/.terraform/terraform.tfstate
[s3-bucket] aws_s3_bucket.s3-bucket: Creating...
[...]
❌ [s3-bucket] Error: Error applying plan:
 1 error(s) occurred:
    * aws_s3_bucket.s3-bucket: 1 error(s) occurred:
    * aws_s3_bucket.s3-bucket: Error creating S3 bucket: BucketAlreadyExists: The requested bucket name is not available. The bucket namespace is shared by all users of the system. Please select a different name and try again.
❌ [s3-bucket] status code: 409, request id: E953BE0A2F944F7A, host id: VTvexuPQ4uMRAuihHqk/RxyGf+6fyGoMygzs1u3I96Hn2LwsBjRNbAEQQz6knE2GA20+GF7Fjvo=
```

## Return

Back to [all features](../features-1.md)


# Feature #3

## Accelerate and automate the testing of terraform commands
```
$ terrahub run --apply --destroy --auto-approve
💡 [s3-bucket] terraform init -no-color .
[s3-bucket] Initializing provider plugins...
[s3-bucket] Terraform has been successfully initialized!
[...]
💡 [s3-bucket] terraform workspace list
[s3-bucket] * default
💡 [s3-bucket] terraform workspace select default
💡 [s3-bucket] terraform plan -no-color -var-file=./s3-bucket/default.tfvars -out=./s3-bucket/.terraform/terraform.tfplan -state=./s3-bucket/.terraform/terraform.tfstate
[s3-bucket] Refreshing Terraform state in-memory prior to plan...
[s3-bucket] The refreshed state will be used to calculate this plan, but will not be
persisted to local or remote state storage.
[...]
💡 [s3-bucket] terraform apply -no-color -var-file=./s3-bucket/default.tfvars -auto-approve=true -state=./s3-bucket/.terraform/terraform.tfstate -backup=./s3-bucket/.terraform/terraform.tfstate.1531605774809.backup -state-out=s3-bucket/.terraform/terraform.tfstate
[s3-bucket] aws_s3_bucket.s3-bucket: Creating...
[...]
💡 [s3-bucket] terraform destroy -no-color -force -var-file=./s3-bucket/default.tfvars -auto-approve=true -state=./s3-bucket/.terraform/terraform.tfstate -backup=./s3-bucket/.terraform/terraform.tfstate.1531605776615.backup -state-out=s3-bucket/.terraform/terraform.tfstate
[s3-bucket] Destroy complete! Resources: 0 destroyed.
✅ Done
```


## Return
Back to [all features](../features.md)

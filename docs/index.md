# TerraHub

TerraHub is a terraform centric devops tool that simplifies provisioning
and management of large amount of cloud resources and cloud services
across multiple cloud accounts. For example: Serverless on Amazon AWS,
or Kubernetes on Google Cloud, or VMs on Microsoft Azure.


## [Commands](docs/commands.md)

| Command | Description | Status |
| :---:   | :---        | :---:  |
| [apply](commands/apply.md) | run `terraform apply` across multiple terraform scripts | :heavy_check_mark: |
| [build](commands/build.md) | build software from predefined build.yml config files | :x: |
| [component](commands/component.md) | include existing terraform folder into current project | :heavy_check_mark: |
| [create](commands/create.md) | create terraform code from predefined templates | :heavy_check_mark: |
| [destroy](commands/destroy.md) | run `terraform destroy` across multiple terraform scripts | :heavy_check_mark: |
| [graph](commands/graph.md) | show the graph of dependencies between terrahub components | :heavy_check_mark: |
| [init](commands/init.md) | run `terraform init` across multiple terraform scripts | :heavy_check_mark: |
| [list](commands/list.md) | list projects > cloud accounts > regions > services > resources | :heavy_check_mark: |
| [plan](commands/plan.md) | run `terraform plan` across multiple terraform scripts | :heavy_check_mark: |
| [project](commands/project.md) | create or update project that manages multiple terraform scripts | :heavy_check_mark: |
| [run](commands/run.md) | run automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [refresh](commands/refresh.md) | run `terraform refresh` across multiple terraform scripts | :x: |
| [show](commands/show.md) | run `terraform show` across multiple terraform scripts | :x: |
| [workspace](commands/workspace.md) | run `terraform workspace` across multiple terraform scripts | :heavy_check_mark: |


## [Features](docs/features.md)

1. [Make it easier and faster to create reusable terraform code](#1-make-it-easier-and-faster-to-create-reusable-terraform-code)
2. [Simplify and distribute the way terraform code is executed](#2-simplify-and-distribute-the-way-terraform-code-is-executed)
3. [Accelerate and automate the testing of terraform commands](#3-accelerate-and-automate-the-testing-of-terraform-commands)
4. [Integrate and manage any existing terraform code](#4-integrate-and-manage-any-existing-terraform-code)
5. [Centralize cloud resources management through realtime dashboards](#5-centralize-cloud-resources-management-through-realtime-dashboards)

### 1. Make it easier and faster to create reusable terraform code
```
$ mkdir ./thub-demo && cd ./thub-demo

$ terrahub project -n "thub-demo"
✅ Project successfully initialized

$ ls -alR
total 8
drwxr-xr-x   4 eugene  staff   136 Apr 07 16:38 .
drwxr-xr-x  83 eugene  staff  2822 Apr 07 16:37 ..
-rw-r--r--   1 eugene  staff   112 Apr 07 16:37 .terrahub.yml

$ terrahub create -n "s3-bucket" -t s3
✅ Done

$ ls -alR
total 8
drwxr-xr-x   4 eugene  staff   136 Apr 07 16:38 .
drwxr-xr-x  83 eugene  staff  2822 Apr 07 16:37 ..
drwxr-xr-x   3 eugene  staff   102 Apr 07 16:38 .terrahub
-rw-r--r--   1 eugene  staff   112 Apr 07 16:37 .terrahub.yml

./.terrahub:
total 0
drwxr-xr-x  3 eugene  staff  102 Apr 07 16:38 .
drwxr-xr-x  4 eugene  staff  136 Apr 07 16:38 ..
drwxr-xr-x  9 eugene  staff  306 Apr 07 16:38 s3-bucket

./.terrahub/s3-bucket:
total 56
drwxr-xr-x  9 eugene  staff   306 Apr 07 16:38 .
drwxr-xr-x  3 eugene  staff   102 Apr 07 16:38 ..
-rw-r--r--  1 eugene  staff    18 Apr 07 16:38 .terrahub.yml
-rw-r--r--  1 eugene  staff  2195 Apr 07 16:38 README.md
-rw-r--r--  1 eugene  staff   998 Apr 07 16:38 default.tfvars
-rw-r--r--  1 eugene  staff   761 Apr 07 16:38 main.tf
-rw-r--r--  1 eugene  staff   422 Apr 07 16:38 output.tf
-rw-r--r--  1 eugene  staff   115 Apr 07 16:38 provider.tf
-rw-r--r--  1 eugene  staff  2318 Apr 07 16:38 variables.tf
```

### 2. Simplify and distribute the way terraform code is executed
```
$ terrahub init
💡 [s3-bucket] terraform init -no-color .
[s3-bucket]
[s3-bucket] Initializing provider plugins...
- Checking for available provider plugins on https://releases.hashicorp.com...
[s3-bucket] - Downloading plugin for provider "aws" (1.21.0)...
[s3-bucket]
[s3-bucket] Terraform has been successfully initialized!
[...]
✅ Done

$ terrahub plan
💡 [s3-bucket] terraform plan -no-color -var-file=.terrahub/s3-bucket/default.tfvars -out=.terrahub/s3-bucket/.resource/terraform.tfplan
[s3-bucket] Refreshing Terraform state in-memory prior to plan...
[s3-bucket] The refreshed state will be used to calculate this plan, but will not be
persisted to local or remote state storage.
[...]
✅ Done

$ terrahub apply --auto-approve
💡 [s3-bucket] terraform apply -no-color -var-file=.terrahub/s3-bucket/default.tfvars -auto-approve=true -state-out=.terrahub/s3-bucket/.resource/terraform.tfstate
[s3-bucket] aws_s3_bucket.s3-bucket: Creating...
[...]

❌ [s3-bucket]

❌ [s3-bucket] Error: Error applying plan:

1 error(s) occurred:

* aws_s3_bucket.s3-bucket: 1 error(s) occurred:

* aws_s3_bucket.s3-bucket: Error creating S3 bucket: BucketAlreadyExists: The requested bucket name is not available. The bucket namespace is shared by all users of the system. Please select a different name and try again.

❌ [s3-bucket] 	status code: 409, request id: E953BE0A2F944F7A, host id: VTvexuPQ4uMRAuihHqk/RxyGf+6fyGoMygzs1u3I96Hn2LwsBjRNbAEQQz6knE2GA20+GF7Fjvo=

✅ Done
```

### 3. Accelerate and automate the testing of terraform commands
```
$ terrahub run --apply --destroy --auto-approve
💡 [s3-bucket] terraform init -no-color .
[s3-bucket]
[s3-bucket] Initializing provider plugins...
[s3-bucket]
[s3-bucket] Terraform has been successfully initialized!
[...]
💡 [s3-bucket] terraform workspace list
[s3-bucket] * default
[s3-bucket]
💡 [s3-bucket] terraform workspace select default
💡 [s3-bucket] terraform plan -no-color -var-file=.terrahub/s3-bucket/default.tfvars -out=.terrahub/s3-bucket/.resource/terraform.tfplan -state=.terrahub/s3-bucket/.resource/terraform.tfstate
[s3-bucket] Refreshing Terraform state in-memory prior to plan...
[s3-bucket] The refreshed state will be used to calculate this plan, but will not be
persisted to local or remote state storage.
[...]
💡 [s3-bucket] terraform apply -no-color -var-file=.terrahub/s3-bucket/default.tfvars -auto-approve=true -state=.terrahub/s3-bucket/.resource/terraform.tfstate -backup=.terrahub/s3-bucket/.resource/terraform.tfstate.1531605774809.backup -state-out=.terrahub/s3-bucket/.resource/terraform.tfstate
[s3-bucket] aws_s3_bucket.s3-bucket: Creating...
[...]
💡 [s3-bucket] terraform destroy -no-color -force -var-file=.terrahub/s3-bucket/default.tfvars -auto-approve=true -state=.terrahub/s3-bucket/.resource/terraform.tfstate -backup=.terrahub/s3-bucket/.resource/terraform.tfstate.1531605776615.backup -state-out=.terrahub/s3-bucket/.resource/terraform.tfstate
[s3-bucket]
[s3-bucket] Destroy complete! Resources: 0 destroyed.
✅ Done
```

### 4. Integrate and manage any existing terraform code
```
$ cd ./security-terraform

$ ls -alR
total 56
drwxr-xr-x   7 eugene  staff    238 Apr 07 18:22 .
drwxr-xr-x  84 eugene  staff   2856 Apr 07 18:21 ..
-rw-r--r--@  1 eugene  staff  15896 Apr 04 12:47 LICENSE
-rw-r--r--   1 eugene  staff     20 Apr 04 14:20 README.md
drwxr-xr-x   9 eugene  staff    306 Apr 07 18:24 iam
-rw-r--r--   1 eugene  staff   3997 Apr 07 11:15 provider.def.tf
-rw-r--r--   1 eugene  staff   2895 Apr 07 10:06 provider.vars.tf

./iam:
total 32
drwxr-xr-x   9 eugene  staff   306 Apr 07 18:24 .
drwxr-xr-x   7 eugene  staff   238 Apr 07 18:22 ..
-rw-r--r--   1 eugene  staff   195 Apr 07 21:01 config.tf
-rw-r--r--   1 eugene  staff    50 Apr 07 21:27 default.tfvars
-rw-r--r--   1 eugene  staff  3877 Apr 07 09:32 main.tf
lrwxr-xr-x   1 eugene  staff    21 Apr 07 21:31 provider.def.tf -> ../../provider.def.tf
lrwxr-xr-x   1 eugene  staff    22 Apr 07 21:31 provider.vars.tf -> ../../provider.vars.tf
-rw-r--r--   1 eugene  staff    30 Apr 07 21:27 variables.tf

$ terrahub project -n "Security_Terraform"
✅ Project successfully initialized

$ terrahub component -n "iam" -d iam/
✅ Done

$ ls -alR
total 64
drwxr-xr-x   8 eugene  staff    272 Apr 07 18:29 .
drwxr-xr-x  84 eugene  staff   2856 Apr 07 18:21 ..
-rw-r--r--   1 eugene  staff    121 Apr 07 18:29 .terrahub.yml
-rw-r--r--@  1 eugene  staff  15896 Apr 04 12:47 LICENSE
-rw-r--r--   1 eugene  staff     20 Apr 04 14:20 README.md
drwxr-xr-x   9 eugene  staff    306 Apr 07 18:30 iam
-rw-r--r--   1 eugene  staff   3997 Apr 07 11:15 provider.def.tf
-rw-r--r--   1 eugene  staff   2895 Apr 07 10:06 provider.vars.tf

./iam:
total 40
drwxr-xr-x  9 eugene  staff   306 Apr 07 18:30 .
drwxr-xr-x  8 eugene  staff   272 Apr 07 18:29 ..
-rw-r--r--  1 eugene  staff    10 Apr 07 18:29 .terrahub.yml
-rw-r--r--  1 eugene  staff   195 Apr 07 21:01 config.tf
-rw-r--r--  1 eugene  staff    50 Apr 07 21:27 default.tfvars
-rw-r--r--  1 eugene  staff  3877 Apr 07 09:32 main.tf
lrwxr-xr-x  1 eugene  staff    21 Apr 07 21:31 provider.def.tf -> ../../provider.def.tf
lrwxr-xr-x  1 eugene  staff    22 Apr 07 21:31 provider.vars.tf -> ../../provider.vars.tf
-rw-r--r--  1 eugene  staff    30 Apr 07 21:27 variables.tf
```

### 5. Centralize cloud resources management through realtime dashboards
```
$ terrahub list --depth 4
💡 Querying cloud accounts, regions and services. It might take a while...
Compiling the list of cloud resources. Use --depth, -d option to view details about projects, accounts, regions and services.

Projects
 └─ 8b947805 (Project 1 of 1)
    └─ ************ (Account 1 of 1)
       └─ us-east-1 (Region 1 of 1)
          ├─ cloudfront (Service 1 of 2)
          │  └─ ************* (Resource 1 of 1)
          └─ s3 (Service 2 of 2)
             ├─ ****************** (Resource 1 of 2)
             └─ ****************** (Resource 2 of 2)

💡 Above list includes ONLY cloud resources that support tagging api.
Please visit https://www.terrahub.io and register to see ALL cloud resources.
✅ Done
```

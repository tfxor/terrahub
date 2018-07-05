# TerraHub

TerraHub is a terraform centric devops tool that helps provision and manage
large amount of cloud resources and cloud services across multiple cloud
accounts. For example: Serverless on Amazon AWS, Kubernetes on Google Cloud
or VMs on Microsoft Azure.

## Commands

```
apply ............. run `terraform apply` across multiple terraform scripts
build ............. build software from predefined build.yml config files
component ......... include existing terraform folder into current project
create ............ create terraform code from predefined templates
deploy ............ deploy software from predefined deploy.yml config files
destroy ........... run `terraform destroy` across multiple terraform scripts
graph ............. show the graph of dependencies between terrahub components
init .............. run `terraform init` across multiple terraform scripts
list .............. list projects > cloud accounts > regions > services > resources
plan .............. run `terraform plan` across multiple terraform scripts
project ........... create or update project that manages multiple terraform scripts
run ............... run automated workflow terraform init > workspace > plan > apply
refresh ........... run `terraform refresh` across multiple terraform scripts
show .............. run `terraform show` across multiple terraform scripts
workspace ......... run `terraform workspace` across multiple terraform scripts
```

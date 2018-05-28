# TerraHub

TerraHub is a Terraform-centric devops tool that helps provision and manage large amount of cloud resources and cloud
 services across cloud providers. For example: Serverless on Amazon AWS, Google Cloud or Microsoft Azure.

## Commands

```
  apply ............. run `terraform apply` across multiple terraform scripts
  build ............. build software from predefined build.yml config files
  create ............ create terraform code from predefined templates
  deploy ............ deploy software from predefined deploy.yml config files
  destroy ........... run `terraform destroy` across multiple terraform scripts
  graph ............. BTU...
  init .............. run `terraform init` across multiple terraform scripts
  list .............. list cloud accounts > regions > applications > services > resources
  plan .............. run `terraform plan` across multiple terraform scripts
  project ........... BTU...
  run ............... BTU...
  refresh ........... run `terraform refresh` across multiple terraform scripts
  show .............. run `terraform show` across multiple terraform scripts
  workspace ......... BTU...
```

## @todo

- THB_CONFIG_FORMAT (json|yml, default json)
- Fix provider issue (project configuration block)
- Implement `--include === -i xxx,yyy,zzz` (use module.name) - ADD OPTION PARSER
- Implement `State` class and refactor `Terraform` class
- Add global config file (store all the constants)

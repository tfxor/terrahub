# TerraHub

TerraHub is a Terraform centric devops tool that helps provision and manage large amount of cloud resources and cloud services across multiple cloud accounts. For example: Serverless on Amazon AWS, Google Cloud or Microsoft Azure.

## Example

1. thb project -n HelloWorld -d ~/hello-world && cd ~/hello-world/
2. thb create -t iam -n DeepProdHelloWorldLambdaExec1234abcd
3. thb create -t iam -n DeepProdHelloWorldApiExec1234abcd
4. thb create -t s3 -n DeepProdPrivate1234abcd
5. thb create -t s3-website -n DeepProdPublic1234abcd
6. thb create -t cf -n DeepProdCdn1234abcd -P DeepProdPublic1234abcd
7. thb create -t lambda -n DeepProdSayHelloCreateDb -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateDb.zip
8. thb create -t lambda -n DeepProdSayHelloCreateFs -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateFs.zip
9. thb create -t lambda -n DeepProdSayHelloCreateMsg -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateMsg.zip
10. thb create -t api -n DeepProdApi1234abcd -P DeepProdHelloWorldApiExec1234abcd
11. thb create -t api-gateway-resource -n DeepHelloWorldSayHelloCreateDb -P DeepProdSayHelloCreateDb
12. thb create -t api-gateway-resource -n DeepHelloWorldSayHelloCreateFs -P DeepProdSayHelloCreateFs
13. thb create -t api-gateway-resource -n DeepHelloWorldSayHelloCreateMsg -P DeepProdSayHelloCreateMsg
14. thb create -t dynamo -n DeepProdName1234abcd
15. thb init
16. thb plan
17. thb apply
18. thb list

## Commands

```
  apply ............. run `terraform apply` across multiple terraform scripts
  build ............. build software from predefined build.yml config files
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

## @todo

- Implement `--include === -i xxx,yyy,zzz` (use module.name) - ADD OPTION PARSER
- Implement `State` class and refactor `Terraform` class

## @toask
- Graph command: components dependencies VS project tree?

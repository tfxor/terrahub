# TerraHub

TerraHub is a terraform centric devops tool that helps provision and manage large amount of cloud resources and cloud
services across multiple cloud accounts. For example: Serverless on Amazon AWS, Google Cloud or Microsoft Azure.

## Commands

```
apply ............. run `terraform apply` across multiple terraform scripts
build ............. build software from predefined build.yml config files (work in progress)
create ............ create terraform code from predefined templates
deploy ............ deploy software from predefined deploy.yml config files (work in progress)
destroy ........... run `terraform destroy` across multiple terraform scripts
graph ............. show the graph of dependencies between terrahub components
init .............. run `terraform init` across multiple terraform scripts
list .............. list projects > cloud accounts > regions > services > resources
plan .............. run `terraform plan` across multiple terraform scripts
project ........... create or update project that manages multiple terraform scripts
run ............... run automated workflow terraform init > workspace > plan > apply
refresh ........... run `terraform refresh` across multiple terraform scripts (work in progress)
show .............. run `terraform show` across multiple terraform scripts (work in progress)
workspace ......... run `terraform workspace` across multiple terraform scripts
```

## Hooks

In order to provide you the best experience we have implemented hooks functionality for following actions: 

* `terraform init` 
* `terraform workspace` 
* `terraform plan`
* `terraform apply`
* `terraform destroy` 

All the hooks should return a Promise and look like: 

* before hook:

```javascript
/**
 * @param {Object} moduleConfig
 * @returns {Promise}
 */
function hook(moduleConfig) {
  return Promise.resolve();
}

module.exports = hook;
```

* after hook:

````javascript
/**
 * @param {Object} moduleConfig
 * @param {Buffer} cmdResult
 * @returns {Promise}
 */
function hook(moduleConfig, cmdResult) {
  return Promise.resolve();
}

module.exports = hook;
````

Configuration example for plan (`.terrahub.json`):

```text
"hooks": {
    "plan": {
        "before": "./hooks/plan/before.js",
        "after": "./hooks/plan/after.js"
    }
}
```

## @todo

- Implement `terrahub workspace`
- Implement `terrahub list` (paid version)
- Implement `terrahub --help`
- Invent something new for testing instead of THUB_ENV

## Example

1. terrahub project -n HelloWorld -d ~/hello-world && cd ~/hello-world/
2. terrahub create -t iam -n DeepProdHelloWorldLambdaExec1234abcd
3. terrahub create -t iam -n DeepProdHelloWorldApiExec1234abcd
4. terrahub create -t s3 -n DeepProdPrivate1234abcd
5. terrahub create -t s3-website -n DeepProdPublic1234abcd
6. terrahub create -t cf -n DeepProdCdn1234abcd -P DeepProdPublic1234abcd
7. terrahub create -t lambda -n DeepProdSayHelloCreateDb -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateDb.zip
8. terrahub create -t lambda -n DeepProdSayHelloCreateFs -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateFs.zip
9. terrahub create -t lambda -n DeepProdSayHelloCreateMsg -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateMsg.zip
10. terrahub create -t api -n DeepProdApi1234abcd -P DeepProdHelloWorldApiExec1234abcd
11. terrahub create -t api-gateway-resource -n DeepHelloWorldSayHelloCreateDb -P DeepProdSayHelloCreateDb
12. terrahub create -t api-gateway-resource -n DeepHelloWorldSayHelloCreateFs -P DeepProdSayHelloCreateFs
13. terrahub create -t api-gateway-resource -n DeepHelloWorldSayHelloCreateMsg -P DeepProdSayHelloCreateMsg
14. terrahub create -t dynamo -n DeepProdName1234abcd
15. terrahub init
16. terrahub plan
17. terrahub apply
18. terrahub list

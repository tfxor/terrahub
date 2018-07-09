# TerraHub

TerraHub is a terraform centric devops tool that simplifies provisioning and management of large amount of cloud 
resources and cloud services across multiple cloud accounts. For example: Serverless on Amazon AWS, or Kubernetes 
on Google Cloud, or VMs on Microsoft Azure.

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
workspace ......... run `terraform workspace select|delete` across multiple terraform scripts
```

## Structure

You can use whatever structure you want, but we recommend you follow this one: 

```text
your-project
├─ .terrahub
│  ├─ s3
│  │  ├── .terrahub.yml
│  │  ├── README.md
│  │  ├── default.tfvars
│  │  ├── main.tf
│  │  ├── output.tf
│  │  ├── provider.tf
│  │  └── variables.tf
│  ├─ cloudfront
│  │  ├── .terrahub.yml
│  │  ├── README.md
│  │  ├── default.tfvars
│  │  ├── main.tf
│  │  ├── output.tf
│  │  ├── provider.tf
│  │  └── variables.tf
├─ .terrahub.yml
├─ src
└─ ...
```

> One exception: **No terraform scripts in root of your project!**

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

```javascript
/**
 * @param {Object} moduleConfig
 * @param {Buffer} cmdResult
 * @returns {Promise}
 */
function hook(moduleConfig, cmdResult) {
  return Promise.resolve();
}

module.exports = hook;
```

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

- Get rid of `request` npm module 
- Implement `--exclude` option for terraform commands
- Rewrite & move publish.sh to `bin/publish.js`

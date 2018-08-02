# TerraHub

## Serverless Hub for Terraform

TerraHub is a terraform centric devops tool that simplifies provisioning
and management of large amount of cloud resources and cloud services
across multiple cloud accounts. For example: Serverless on Amazon AWS,
or Kubernetes on Google Cloud, or VMs on Microsoft Azure.


![TerraHub CLI and TerraHub Console in Action](docs/images/terrahub-in-action.gif "TerraHub CLI and TerraHub Console in Action")


## [Features](https://github.com/MitocGroup/terrahub/blob/master/docs/features.md)

1. [Make it easier and faster to create reusable terraform configuration](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features1.md)
2. [Simplify and distribute the way terraform configuration is executed](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features2.md)
3. [Accelerate and automate the testing of terraform commands](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features3.md)
4. [Integrate and manage any existing terraform configuration](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features4.md)
5. [Centralize cloud resources management through realtime dashboards](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features5.md)
6. [Streamline integration and deployment with built-in CI and CD processes](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features6.md)
7. [NO NEED to expose your private network to outside world at all](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features7.md)


## [Commands](https://github.com/MitocGroup/terrahub/blob/master/docs/commands.md)

| Command | Description | Status |
| :---:   | :---        | :---:  |
|| **# terrahub management** ||
| [project](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/project.md) | create or update project that manages terraform configuration | :heavy_check_mark: |
| [component](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/component.md) | create new or include existing terraform configuration into current terrahub project | :heavy_check_mark: |
| [graph](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/graph.md) | show the graph of dependencies between terrahub components | :heavy_check_mark: |
|| **# terraform execution** ||
| [apply](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/apply.md) | run `terraform apply` across multiple terrahub components | :heavy_check_mark: |
| [destroy](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/destroy.md) | run `terraform destroy` across multiple terrahub components | :heavy_check_mark: |
| [init](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/init.md) | run `terraform init` across multiple terrahub components | :heavy_check_mark: |
| [output](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/output.md) | run `terraform output` across multiple terrahub components | :heavy_check_mark: |
| [plan](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/plan.md) | run `terraform plan` across multiple terrahub components | :heavy_check_mark: |
| [refresh](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/refresh.md) | run `terraform refresh` across multiple terrahub components | :x: |
| [show](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/show.md) | run `terraform show` across multiple terrahub components | :x: |
| [workspace](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/workspace.md) | run `terraform workspace` across multiple terrahub components | :heavy_check_mark: |
|| **# cloud automation** ||
| [build](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/build.md) | build code used by terraform configuration (e.g. AWS Lambda, Google Functions) | :heavy_check_mark: |
| [run](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/run.md) | execute automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [list](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/list.md) | list cloud resources by projects > accounts > regions > services > resources | :heavy_check_mark: |


## [Structure](https://github.com/MitocGroup/terrahub/blob/master/docs/structure.md)

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


## [Hooks](https://github.com/MitocGroup/terrahub/blob/master/docs/hooks.md)

In order to provide you the best experience we have implemented hooks functionality for following actions: 

* `terraform init`
* `terraform workspace`
* `terraform plan`
* `terraform apply`
* `terraform output`
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

- Get rid of `request` & `download` npm modules
- Implement `--exclude` option for terraform commands

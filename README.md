# TerraHub

TerraHub is a terraform centric devops tool that simplifies provisioning
and management of large amount of cloud resources and cloud services
across multiple cloud accounts. For example: Serverless on Amazon AWS,
or Kubernetes on Google Cloud, or VMs on Microsoft Azure.


## [Features](https://github.com/MitocGroup/terrahub/blob/master/docs/features.md)

1. [Make it easier and faster to create reusable terraform code](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features1.md)
2. [Simplify and distribute the way terraform code is executed](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features2.md)
3. [Accelerate and automate the testing of terraform commands](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features3.md)
4. [Integrate and manage any existing terraform code](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features4.md)
5. [Centralize cloud resources management through realtime dashboards](https://github.com/MitocGroup/terrahub/blob/master/docs/features/features5.md)


## [Commands](https://github.com/MitocGroup/terrahub/blob/master/docs/commands.md)

| Command | Description | Status |
| :---:   | :---        | :---:  |
| [apply](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/apply.md) | run `terraform apply` across multiple terraform scripts | :heavy_check_mark: |
| [build](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/build.md) | build software from predefined build.yml config files | :x: |
| [component](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/component.md) | include existing terraform folder into current project | :heavy_check_mark: |
| [create](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/create.md) | create terraform code from predefined templates | :heavy_check_mark: |
| [destroy](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/destroy.md) | run `terraform destroy` across multiple terraform scripts | :heavy_check_mark: |
| [graph](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/graph.md) | show the graph of dependencies between terrahub components | :heavy_check_mark: |
| [init](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/init.md) | run `terraform init` across multiple terraform scripts | :heavy_check_mark: |
| [list](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/list.md) | list projects > cloud accounts > regions > services > resources | :heavy_check_mark: |
| [plan](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/plan.md) | run `terraform plan` across multiple terraform scripts | :heavy_check_mark: |
| [project](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/project.md) | create or update project that manages multiple terraform scripts | :heavy_check_mark: |
| [run](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/run.md) | run automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [refresh](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/refresh.md) | run `terraform refresh` across multiple terraform scripts | :x: |
| [show](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/show.md) | run `terraform show` across multiple terraform scripts | :x: |
| [workspace](https://github.com/MitocGroup/terrahub/blob/master/docs/commands/workspace.md) | run `terraform workspace` across multiple terraform scripts | :heavy_check_mark: |


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

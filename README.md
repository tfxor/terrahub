# TerraHub

TerraHub is a terraform centric devops tool that simplifies provisioning
and management of large amount of cloud resources and cloud services
across multiple cloud accounts. For example: Serverless on Amazon AWS,
or Kubernetes on Google Cloud, or VMs on Microsoft Azure.


## [Features](docs/features.md)

1. [Make it easier and faster to create reusable terraform code](docs/features.md#1-make-it-easier-and-faster-to-create-reusable-terraform-code)
2. [Simplify and distribute the way terraform code is executed](docs/features.md#2-simplify-and-distribute-the-way-terraform-code-is-executed)
3. [Accelerate and automate the testing of terraform commands](docs/features.md#3-accelerate-and-automate-the-testing-of-terraform-commands)
4. [Integrate and manage any existing terraform code](docs/features.md#4-integrate-and-manage-any-existing-terraform-code)
5. [Centralize cloud resources management through realtime dashboards](docs/features.md#5-centralize-cloud-resources-management-through-realtime-dashboards)


## [Commands](docs/commands.md)

| Command | Description | Status |
| :---:   | :---        | :---:  |
| [apply](docs/commands/apply.md) | run `terraform apply` across multiple terraform scripts | :heavy_check_mark: |
| [build](docs/commands/build.md) | build software from predefined build.yml config files | :x: |
| [component](docs/commands/component.md) | include existing terraform folder into current project | :heavy_check_mark: |
| [create](docs/commands/create.md) | create terraform code from predefined templates | :heavy_check_mark: |
| [destroy](docs/commands/destroy.md) | run `terraform destroy` across multiple terraform scripts | :heavy_check_mark: |
| [graph](docs/commands/graph.md) | show the graph of dependencies between terrahub components | :heavy_check_mark: |
| [init](docs/commands/init.md) | run `terraform init` across multiple terraform scripts | :heavy_check_mark: |
| [list](docs/commands/list.md) | list projects > cloud accounts > regions > services > resources | :heavy_check_mark: |
| [plan](docs/commands/plan.md) | run `terraform plan` across multiple terraform scripts | :heavy_check_mark: |
| [project](docs/commands/project.md) | create or update project that manages multiple terraform scripts | :heavy_check_mark: |
| [run](docs/commands/run.md) | run automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [refresh](docs/commands/refresh.md) | run `terraform refresh` across multiple terraform scripts | :x: |
| [show](docs/commands/show.md) | run `terraform show` across multiple terraform scripts | :x: |
| [workspace](docs/commands/workspace.md) | run `terraform workspace` across multiple terraform scripts | :heavy_check_mark: |


## [Structure](docs/structure.md)

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


## [Hooks](docs/hooks.md)

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

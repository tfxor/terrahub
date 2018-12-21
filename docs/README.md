# Welcome to TerraHub

## Quick Links

[Install](#install) | [Examples](#examples) | [Features](#features) | [Commands](#commands) | [Automation](#automation)

TerraHub ecosystem includes:
* [TerraHub CLI](https://www.npmjs.com/package/terrahub) -
terraform automation and orchestration tool (open source)
* [TerraHub API](https://www.terrahub.io/api) -
data and logs management, requires token to collect anything
* [TerraHub Console](https://console.terrahub.io) -
enterprise friendly GUI to show realtime executions, includes
auditing and reporting capabilities for historical terraform runs

![TerraHub CLI and TerraHub Console in Action](images/terrahub-in-action.gif "TerraHub CLI and TerraHub Console in Action")


## [Install](install.md)

TerraHub CLI is built using [nodejs](https://nodejs.org) and published using
[npm](https://www.npmjs.com). Quick steps to get started:
```shell
$ node -v
v6.10.0
$ npm -v
v3.10.0
$ npm install -g terrahub
~/.nvm/versions/node/v6.10.0/lib
└── terrahub@0.0.1
$ terrahub --help
```

> NOTE: [TerraHub CLI](https://www.npmjs.com/package/terrahub) doesn't magically
collect your data and upload to [TerraHub API](https://www.terrahub.io),
which is further visualized in [TerraHub Console](https://console.terrahub.io).
In order to do that, please sign up for a free account at
[console.terrahub.io](https://console.terrahub.io) and navigate to
[Settings](https://console.terrahub.io/settings) page to copy TerraHub Token.
Next, you can setup TerraHub Token as `THUB_TOKEN` environmental variable or
update `token` value in global config file - `$HOME/.terrahub/.terrahub.json`.


## [Examples](examples.md)

* [Terraform Automation using AWS Provider](https://github.com/TerraHubCorp/demo-terraform-automation-aws)
* [Terraform Automation using Google Provider](https://github.com/TerraHubCorp/demo-terraform-automation-google)


## [Features](features.md)

1. [Make it easier and faster to create reusable terraform configuration](features/features1.md)
2. [Simplify and distribute the way terraform configuration is executed](features/features2.md)
3. [Accelerate and automate the testing of terraform commands](features/features3.md)
4. [Integrate and manage any existing terraform configuration](features/features4.md)
5. [Centralize cloud resources management through realtime dashboards](features/features5.md)
6. [Streamline integration and deployment with built-in CI and CD processes](features/features6.md)
7. [NO NEED to expose your private network to outside world at all](features/features7.md)


## [Commands](commands.md)

When running `terrahub --help`, you will get a list of commands, summarized below:

| Command | Description | Status |
| :---:   | :---        | :---:  |
|| **# terrahub management** ||
| [project](commands/project.md) | create new or define existing folder as project that manages terraform configuration | :heavy_check_mark: |
| [component](commands/component.md) | create new or include existing terraform configuration into current terrahub project | :heavy_check_mark: |
| [configure](commands/configure.md) | add, change or remove config parameters from terrahub config files | :heavy_check_mark: |
| [graph](commands/graph.md) | show dependencies graph for terraform configuration mapped as terrahub components | :heavy_check_mark: |
|| **# terraform execution** ||
| [apply](commands/apply.md) | run `terraform apply` across multiple terrahub components | :heavy_check_mark: |
| [destroy](commands/destroy.md) | run `terraform destroy` across multiple terrahub components | :heavy_check_mark: |
| [init](commands/init.md) | run `terraform init` across multiple terrahub components | :heavy_check_mark: |
| [output](commands/output.md) | run `terraform output` across multiple terrahub components | :heavy_check_mark: |
| [plan](commands/plan.md) | run `terraform plan` across multiple terrahub components | :heavy_check_mark: |
| [refresh](commands/refresh.md) | run `terraform refresh` across multiple terrahub components | :heavy_check_mark: |
| [workspace](commands/workspace.md) | run `terraform workspace` across multiple terrahub components | :heavy_check_mark: |
|| **# cloud automation** ||
| [build](commands/build.md) | build code used by terraform configuration (e.g. AWS Lambda, Google Functions) | :heavy_check_mark: |
| [run](commands/run.md) | execute automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [list](commands/list.md) | list cloud resources by projects > accounts > regions > services > resources | :heavy_check_mark: |


## [Automation](automation.md)

[Running Terraform in Automation](https://terraform.io/guides/running-terraform-in-automation.html)
describes the value proposition of deploying regularly in production.
Tools like [Astro](https://github.com/uber/astro),
[Atlantis](https://github.com/runatlantis/atlantis) and
[Terragrunt](https://github.com/gruntwork-io/terragrunt)
partially cover automation workflow, but not deep enough.

TerraHub takes terraform automation to a new level of simplicity and
built-in capabilities. Here below is how it works:

![TerraHub Automation](https://raw.githubusercontent.com/TerraHubCorp/terrahub/dev/docs/images/terrahub-automation.png "TerraHub Automation")

To learn more, please visit [TerraHub Website](https://www.terrahub.io/how-it-works)

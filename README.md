# Welcome to TerraHub

## Quick Links

[TerraHub CLI](#terrahub-cli) | [TerraHub API](#terrahub-api) | [TerraHub Console](#terrahub-console) | [Install CLI](#install-cli) | [Examples](#examples) | [Learn More](#learn-more)


## TerraHub CLI

terraform automation and orchestration tool
- built using [node.js](https://nodejs.org)
- published using [npm](https://www.npmjs.com/package/terrahub)
- managed using [github](https://github.com/TerraHubCorp/terrahub)
- documented using [gitbook](https://www1.terrahub.io)


## TerraHub API

data and logs management, requires token to collect anything
- built using [node.js](https://nodejs.org)
- managed using [swagger](https://www.terrahub.io/api)
- documented using [swagger](https://www.terrahub.io/api)


## TerraHub Console

enterprise friendly GUI to show realtime executions, as well as
auditing and reporting capabilities for historical terraform runs
- built using [vue.js](https://vuejs.org)
- managed using [webpack](https://webpack.js.org)
- published using [terrahub](https://console.terrahub.io)


## Install CLI

Quick steps to get started:

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

> NOTE: [TerraHub CLI](https://www.npmjs.com/package/terrahub) doesn't magically collect your data and upload to [TerraHub API](https://www.terrahub.io), which is further visualized in [TerraHub Console](https://console.terrahub.io). In order to do that, please sign up for a free account at [console.terrahub.io](https://console.terrahub.io) and navigate to [Settings](https://console.terrahub.io/settings) page to copy TerraHub Token. Next, you can setup TerraHub Token as `THUB_TOKEN` environmental variable or update `token` value in global config file - `$HOME/.terrahub/.terrahub.json`.


## Examples

![TerraHub CLI and TerraHub Console in Action](https://raw.githubusercontent.com/TerraHubCorp/terrahub/dev/docs/images/terrahub-in-action.gif "TerraHub CLI and TerraHub Console in Action")

* [Terraform Automation using AWS Provider](https://github.com/TerraHubCorp/demo-terraform-automation-aws)
* [Terraform Automation using Google Provider](https://github.com/TerraHubCorp/demo-terraform-automation-google)


## Features

1. [Feature \#1](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features1.md) -
Make it easier and faster to create reusable terraform configuration
2. [Feature \#2](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features2.md) -
Simplify and distribute the way terraform configuration is executed
3. [Feature \#3](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features3.md) -
Accelerate and automate the testing of terraform commands
4. [Feature \#4](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features4.md) -
Integrate and manage any existing terraform configuration
5. [Feature \#5](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features5.md) -
Centralize cloud resources management through realtime dashboards
6. [Feature \#6](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features6.md) -
Streamline integration and deployment with built-in CI and CD processes
7. [Feature \#7](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features7.md) -
NO NEED to expose your private network to outside world at all


## Commands

When running `terrahub --help`, you will get a list of commands, summarized below:

| Command | Description | Status |
| :---:   | :---        | :---:  |
|| **\# terrahub management** ||
| [project](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/project.md) | create new or define existing folder as project that manages terraform configuration | :heavy_check_mark: |
| [component](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/component.md) | create new or include existing terraform configuration into current terrahub project | :heavy_check_mark: |
| [configure](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/configure.md) | add, change or remove config parameters from terrahub config files | :heavy_check_mark: |
| [graph](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/graph.md) | show dependencies graph for terraform configuration mapped as terrahub components | :heavy_check_mark: |
|| **\# terraform execution** ||
| [apply](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/apply.md) | run `terraform apply` across multiple terrahub components | :heavy_check_mark: |
| [destroy](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/destroy.md) | run `terraform destroy` across multiple terrahub components | :heavy_check_mark: |
| [init](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/init.md) | run `terraform init` across multiple terrahub components | :heavy_check_mark: |
| [output](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/output.md) | run `terraform output` across multiple terrahub components | :heavy_check_mark: |
| [plan](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/plan.md) | run `terraform plan` across multiple terrahub components | :heavy_check_mark: |
| [refresh](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/refresh.md) | run `terraform refresh` across multiple terrahub components | :heavy_check_mark: |
| [workspace](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/workspace.md) | run `terraform workspace` across multiple terrahub components | :heavy_check_mark: |
|| **\# cloud automation** ||
| [build](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/build.md) | build code used by terraform configuration (e.g. AWS Lambda, Google Functions) | :heavy_check_mark: |
| [run](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/run.md) | execute automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [list](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/list.md) | list cloud resources by projects > accounts > regions > services > resources | :heavy_check_mark: |


## Automation

Official guide for [Running Terraform in Automation](https://terraform.io/guides/running-terraform-in-automation.html) describes the value proposition of deploying regularly in production. Tools like [Astro](https://github.com/uber/astro), [Atlantis](https://github.com/runatlantis/atlantis) and [Terragrunt](https://github.com/gruntwork-io/terragrunt) partially cover automation workflow needs, but not deep enough.

TerraHub takes terraform automation to a new level of simplicity and built-in capabilities. Here below is how it works:

![TerraHub Automation](https://raw.githubusercontent.com/TerraHubCorp/terrahub/dev/docs/images/terrahub-automation.png "TerraHub Automation")

To learn more, please visit [TerraHub Website](https://www.terrahub.io/how-it-works)

# TerraHub

## DevOps Hub for Terraform Automation

TerraHub ecosystem includes:
* [TerraHub CLI](https://www.npmjs.com/package/terrahub) -
terraform automation and orchestration tool (open source)
* [TerraHub API](https://www.terrahub.io/api) -
data and logs management, requires token to collect anything
* [TerraHub Console](https://console.terrahub.io) -
enterprise friendly GUI to show realtime executions, includes
auditing and reporting capabilities for historical terraform runs

![TerraHub CLI and TerraHub Console in Action](https://raw.githubusercontent.com/TerraHubCorp/terrahub/dev/docs/images/terrahub-in-action.gif "TerraHub CLI and TerraHub Console in Action")


## [Features](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features.md)

1. [Make it easier and faster to create reusable terraform configuration](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features1.md)
2. [Simplify and distribute the way terraform configuration is executed](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features2.md)
3. [Accelerate and automate the testing of terraform commands](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features3.md)
4. [Integrate and manage any existing terraform configuration](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features4.md)
5. [Centralize cloud resources management through realtime dashboards](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features5.md)
6. [Streamline integration and deployment with built-in CI and CD processes](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features6.md)
7. [NO NEED to expose your private network to outside world at all](https://github.com/TerraHubCorp/terrahub/blob/master/docs/features/features7.md)


## [Commands](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands.md)

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
Next, you can setup `THUB_TOKEN` environmental variable or update `token` value
in `$HOME/.terrahub/.terrahub.json` global config file.

When running `terrahub --help`, you will get a list of commands, summarized below:

| Command | Description | Status |
| :---:   | :---        | :---:  |
|| **# terrahub management** ||
| [project](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/project.md) | create new or define existing folder as project that manages terraform configuration | :heavy_check_mark: |
| [component](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/component.md) | create new or include existing terraform configuration into current terrahub project | :heavy_check_mark: |
| [configure](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/configure.md) | add, change or remove config parameters from terrahub config files | :heavy_check_mark: |
| [graph](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/graph.md) | show dependencies graph for terraform configuration mapped as terrahub components | :heavy_check_mark: |
|| **# terraform execution** ||
| [apply](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/apply.md) | run `terraform apply` across multiple terrahub components | :heavy_check_mark: |
| [destroy](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/destroy.md) | run `terraform destroy` across multiple terrahub components | :heavy_check_mark: |
| [init](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/init.md) | run `terraform init` across multiple terrahub components | :heavy_check_mark: |
| [output](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/output.md) | run `terraform output` across multiple terrahub components | :heavy_check_mark: |
| [plan](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/plan.md) | run `terraform plan` across multiple terrahub components | :heavy_check_mark: |
| [refresh](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/refresh.md) | run `terraform refresh` across multiple terrahub components | :heavy_check_mark: |
| [workspace](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/workspace.md) | run `terraform workspace` across multiple terrahub components | :heavy_check_mark: |
|| **# cloud automation** ||
| [build](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/build.md) | build code used by terraform configuration (e.g. AWS Lambda, Google Functions) | :heavy_check_mark: |
| [run](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/run.md) | execute automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [list](https://github.com/TerraHubCorp/terrahub/blob/master/docs/commands/list.md) | list cloud resources by projects > accounts > regions > services > resources | :heavy_check_mark: |


## [Automation](https://github.com/TerraHubCorp/terrahub/blob/master/docs/automation.md)

[Running Terraform in Automation](https://terraform.io/guides/running-terraform-in-automation.html)
describes the value proposition of deploying regularly in production.
Tools like [Astro](https://github.com/uber/astro),
[Atlantis](https://github.com/runatlantis/atlantis) and
[Terragrunt](https://github.com/gruntwork-io/terragrunt)
partially cover automation needs.

TerraHub takes terraform automation to a new level of simplicity and
built-in capabilities. Here below is how it works:

![TerraHub Automation](https://raw.githubusercontent.com/TerraHubCorp/terrahub/dev/docs/images/terrahub-automation.png "TerraHub Automation")



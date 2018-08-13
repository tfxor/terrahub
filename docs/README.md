# TerraHub

## DevOps Hub for Terraform

TerraHub is a terraform centric devops tool that simplifies provisioning and
management at scale of cloud resources and cloud services across multiple cloud
accounts. For example: Serverless on Amazon AWS, or Kubernetes on Google Cloud,
or VMs on Microsoft Azure.

![TerraHub CLI and TerraHub Console in Action](images/terrahub-in-action.gif "TerraHub CLI and TerraHub Console in Action")


## [Features](features.md)

1. [Make it easier and faster to create reusable terraform configuration](features/features1.md)
2. [Simplify and distribute the way terraform configuration is executed](features/features2.md)
3. [Accelerate and automate the testing of terraform commands](features/features3.md)
4. [Integrate and manage any existing terraform configuration](features/features4.md)
5. [Centralize cloud resources management through realtime dashboards](features/features5.md)
6. [Streamline integration and deployment with built-in CI and CD processes](features/features6.md)
7. [NO NEED to expose your private network to outside world at all](features/features7.md)


## [Commands](commands.md)

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
collects your data and uploads to [TerraHub API](https://www.terrahub.io),
which is visualized in [TerraHub Console](https://console.terrahub.io).
In order to do that, please sign up for a free account at
[console.terrahub.io](https://console.terrahub.io) and navigate to
[Settings](https://console.terrahub.io/settings) >
[Access](https://console.terrahub.io/settings/access) to copy TerraHub token.
Next, you can setup `THUB_TOKEN` environmental variable or update `token` value
in `$HOME/.terrahub/.terrahub.json` global config file.

When running `terrahub --help`, you will get a list of commands, summarized below:

| Command | Description | Status |
| :---:   | :---        | :---:  |
|| **# terrahub management** ||
| [project](commands/project.md) | create new or define existing folder as project that manages terraform configuration | :heavy_check_mark: |
| [component](commands/component.md) | create new or include existing terraform configuration into current terrahub project | :heavy_check_mark: |
| [graph](commands/graph.md) | show dependencies graph for terraform configuration mapped as terrahub components | :heavy_check_mark: |
|| **# terraform execution** ||
| [apply](commands/apply.md) | run `terraform apply` across multiple terrahub components | :heavy_check_mark: |
| [destroy](commands/destroy.md) | run `terraform destroy` across multiple terrahub components | :heavy_check_mark: |
| [init](commands/init.md) | run `terraform init` across multiple terrahub components | :heavy_check_mark: |
| [output](commands/output.md) | run `terraform output` across multiple terrahub components | :heavy_check_mark: |
| [plan](commands/plan.md) | run `terraform plan` across multiple terrahub components | :heavy_check_mark: |
| [refresh](commands/refresh.md) | run `terraform refresh` across multiple terrahub components | :x: |
| [show](commands/show.md) | run `terraform show` across multiple terrahub components | :x: |
| [workspace](commands/workspace.md) | run `terraform workspace` across multiple terrahub components | :heavy_check_mark: |
|| **# cloud automation** ||
| [build](commands/build.md) | build code used by terraform configuration (e.g. AWS Lambda, Google Functions) | :heavy_check_mark: |
| [run](commands/run.md) | execute automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [list](commands/list.md) | list cloud resources by projects > accounts > regions > services > resources | :heavy_check_mark: |

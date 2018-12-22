# Commands

TerraHub CLI is built using [nodejs](https://nodejs.org) and published using [npm](https://www.npmjs.com). Quick steps to get started:

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

When running `terrahub --help`, you will get a list of commands, summarized below:

| Command  | Description | Status |
| :---:    | :---        | :---:  |
|| **# terrahub management** ||
| [project](project.md) | create new or define existing folder as project that manages terraform configuration | :heavy_check_mark: |
| [component](component.md) | create new or include existing terraform configuration into current terrahub project | :heavy_check_mark: |
| [configure](configure.md) | add, change or remove config parameters from terrahub config files | :heavy_check_mark: |
| [graph](graph.md) | show dependencies graph for terraform configuration mapped as terrahub components | :heavy_check_mark: |
|| **# terraform execution** ||
| [apply](apply.md) | run `terraform apply` across multiple terrahub components | :heavy_check_mark: |
| [destroy](destroy.md) | run `terraform destroy` across multiple terrahub components | :heavy_check_mark: |
| [init](init.md) | run `terraform init` across multiple terrahub components | :heavy_check_mark: |
| [output](output.md) | run `terraform output` across multiple terrahub components | :heavy_check_mark: |
| [plan](plan.md) | run `terraform plan` across multiple terrahub components | :heavy_check_mark: |
| [refresh](refresh.md) | run `terraform refresh` across multiple terrahub components | :heavy_check_mark: |
| [workspace](workspace.md) | run `terraform workspace` across multiple terrahub components | :heavy_check_mark: |
|| **# cloud automation** ||
| [build](build.md) | build code used by terraform configuration (e.g. AWS Lambda, Google Functions) | :heavy_check_mark: |
| [run](run.md) | execute automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [list](list.md) | list cloud resources by projects > accounts > regions > services > resources | :heavy_check_mark: |

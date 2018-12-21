# Commands

TerraHub CLI is built using [nodejs](https://nodejs.org) and published using [npm](https://www.npmjs.com). Quick steps to get started:

```text
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

| Command | Description | Status |
| :---: | :--- | :---: |
|  | **\# terrahub management** |  |
| [project](commands/project.md) | create new or define existing folder as project that manages terraform configuration | :heavy\_check\_mark: |
| [component](commands/component.md) | create new or include existing terraform configuration into current terrahub project | :heavy\_check\_mark: |
| [configure](commands/configure.md) | add, change or remove config parameters from terrahub config files | :heavy\_check\_mark: |
| [graph](commands/graph.md) | show dependencies graph for terraform configuration mapped as terrahub components | :heavy\_check\_mark: |
|  | **\# terraform execution** |  |
| [apply](commands/apply.md) | run `terraform apply` across multiple terrahub components | :heavy\_check\_mark: |
| [destroy](commands/destroy.md) | run `terraform destroy` across multiple terrahub components | :heavy\_check\_mark: |
| [init](commands/init.md) | run `terraform init` across multiple terrahub components | :heavy\_check\_mark: |
| [output](commands/output.md) | run `terraform output` across multiple terrahub components | :heavy\_check\_mark: |
| [plan](commands/plan.md) | run `terraform plan` across multiple terrahub components | :heavy\_check\_mark: |
| [refresh](commands/refresh.md) | run `terraform refresh` across multiple terrahub components | :heavy\_check\_mark: |
| [workspace](commands/workspace.md) | run `terraform workspace` across multiple terrahub components | :heavy\_check\_mark: |
|  | **\# cloud automation** |  |
| [build](commands/build.md) | build code used by terraform configuration \(e.g. AWS Lambda, Google Functions\) | :heavy\_check\_mark: |
| [run](commands/run.md) | execute automated workflow terraform init &gt; workspace &gt; plan &gt; apply | :heavy\_check\_mark: |
| [list](commands/list.md) | list cloud resources by projects &gt; accounts &gt; regions &gt; services &gt; resources | :heavy\_check\_mark: |

## Return

Back to [readme](https://github.com/TerraHubCorp/terrahub/tree/a9d1822eae83783b84e5398738e2812effddc46d/docs/readme.md)


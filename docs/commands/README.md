# Commands

Getting started with TerraHub CLI is pretty straightforward:

1. Next, check if `npm` is installed:

  ```shell
  npm -v
  ```

  The output should look similar to the one below (do not copy paste):

  ```text
  v3.10.0
  ```

  > NOTE: If `npm` is missing, check out [Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

2. Finally, install `terrahub`:

  ```shell
  npm install -g terrahub
  ```

  The output should look similar to the one below (do not copy paste):

  ```text
  ~/.nvm/versions/node/v6.10.0/lib
  └── terrahub@0.0.1
  ```

3. Test if `terrahub` cli was installed properly:

  ```shell
  terrahub --help
  ```

  > NOTE: [TerraHub CLI](https://www.npmjs.com/package/terrahub) doesn't magically collect your data and upload to [TerraHub API](https://www.terrahub.io/api), which is further visualized in [TerraHub Console](https://console.terrahub.io). In order to do that, please sign up for a free account at [console.terrahub.io](https://console.terrahub.io) and navigate to [Settings](https://console.terrahub.io/settings) page to copy TerraHub Token. Next, setup TerraHub Token as `THUB_TOKEN` environmental variable or update `token` value in global config file - `$HOME/.terrahub/.terrahub.json`.

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

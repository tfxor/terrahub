# Commands

| Command  | Description | Status |
| :---:    | :---        | :---:  |
|| **# terrahub management** ||
| [project](commands/project.md) | create or update project that manages terraform configuration | :heavy_check_mark: |
| [component](commands/component.md) | create new or include existing terraform configuration into current terrahub project | :heavy_check_mark: |
| [graph](commands/graph.md) | show the graph of dependencies between terrahub components | :heavy_check_mark: |
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


## Return
Back to [readme](readme.md)

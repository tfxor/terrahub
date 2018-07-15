# TerraHub

TerraHub is a terraform centric devops tool that simplifies provisioning
and management of large amount of cloud resources and cloud services
across multiple cloud accounts. For example: Serverless on Amazon AWS,
or Kubernetes on Google Cloud, or VMs on Microsoft Azure.


## [Features](features.md)

1. [Make it easier and faster to create reusable terraform code](features/features1.md)
2. [Simplify and distribute the way terraform code is executed](features/features2.md)
3. [Accelerate and automate the testing of terraform commands](features/features3.md)
4. [Integrate and manage any existing terraform code](features/features4.md)
5. [Centralize cloud resources management through realtime dashboards](features/features5.md)


## [Commands](commands.md)

| Command | Description | Status |
| :---:   | :---        | :---:  |
| [apply](commands/apply.md) | run `terraform apply` across multiple terraform scripts | :heavy_check_mark: |
| [build](commands/build.md) | build software from predefined build.yml config files | :x: |
| [component](commands/component.md) | include existing terraform folder into current project | :heavy_check_mark: |
| [create](commands/create.md) | create terraform code from predefined templates | :heavy_check_mark: |
| [destroy](commands/destroy.md) | run `terraform destroy` across multiple terraform scripts | :heavy_check_mark: |
| [graph](commands/graph.md) | show the graph of dependencies between terrahub components | :heavy_check_mark: |
| [init](commands/init.md) | run `terraform init` across multiple terraform scripts | :heavy_check_mark: |
| [list](commands/list.md) | list projects > cloud accounts > regions > services > resources | :heavy_check_mark: |
| [plan](commands/plan.md) | run `terraform plan` across multiple terraform scripts | :heavy_check_mark: |
| [project](commands/project.md) | create or update project that manages multiple terraform scripts | :heavy_check_mark: |
| [run](commands/run.md) | run automated workflow terraform init > workspace > plan > apply | :heavy_check_mark: |
| [refresh](commands/refresh.md) | run `terraform refresh` across multiple terraform scripts | :x: |
| [show](commands/show.md) | run `terraform show` across multiple terraform scripts | :x: |
| [workspace](commands/workspace.md) | run `terraform workspace` across multiple terraform scripts | :heavy_check_mark: |

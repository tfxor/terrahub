# Features

## Quick Links

1. [Feature \#1](#features-1) -
Make it easier and faster to create reusable terraform configuration
2. [Feature \#2](#features-2) -
Simplify and distribute the way terraform configuration is executed
3. [Feature \#3](#features-3) -
Accelerate and automate the testing of terraform commands
4. [Feature \#4](#features-4) -
Integrate and manage any existing terraform configuration
5. [Feature \#5](#features-5) -
Centralize cloud resources management through realtime dashboards
6. [Feature \#6](#features-6) -
Streamline integration and deployment with built-in CI and CD processes
7. [Feature \#7](#features-7) -
NO NEED to expose your private network to outside world at all


## [Feature \#1](features1.md)

### Easier and Faster Create Reusable Terraform Configurations

```shell
$ mkdir ./thub-demo/ && cd ./thub-demo/

$ terrahub project -n "thub-demo"
✅ Project successfully initialized
```

More details [here](features1.md)


## [Feature \#2](features2.md)

### Simplified and Distributed Process of Executing Terraform Configurations

```shell
$ terrahub init
💡 [s3-bucket] terraform init -no-color .
[s3-bucket]
[s3-bucket] Initializing provider plugins...
- Checking for available provider plugins on https://releases.hashicorp.com...
[s3-bucket] - Downloading plugin for provider "aws" (1.21.0)...
[s3-bucket]
[s3-bucket] Terraform has been successfully initialized!
[...]
✅ Done
```

More details [here](features2.md)


## [Feature \#3](features3.md)

### Automated and Accelerated Process of Testing Terraform Commands

```shell
$ terrahub run --apply --destroy --auto-approve
💡 [s3-bucket] terraform init -no-color .
[s3-bucket]
[s3-bucket] Initializing provider plugins...
[s3-bucket]
[s3-bucket] Terraform has been successfully initialized!
[...]
✅ Done
```

More details [here](features3.md)


## [Feature \#4](features4.md)

### Integrated Process to Manage Existing Terraform Configurations

```shell
$ cd ./security-terraform/

$ terrahub project -n "Security_Terraform"
✅ Project successfully initialized

$ terrahub component -n "iam-idp" -d ./iam-idp/
✅ Done
```

More details [here](features4.md)


## [Feature \#5](features5.md)

### Centralized Management of Cloud Resources Through Realtime Dashboards

```shell
$ terrahub list --depth 4
💡 Querying cloud accounts, regions and services. It might take a while...
Compiling the list of cloud resources. Use --depth, -d option to view details about projects, accounts, regions and services.
[...]
✅ Done
```

More details [here](features5.md)


## [Feature \#6](features6.md)

### Streamlined Integration and Deployment with Built-in CI and CD Processes

```
TBU
```

More details [here](features6.md)


## [Feature \#7](features7.md)

### NO NEED to Expose Private Networks to Outside World at All

```
TBU
```

More details [here](features7.md)

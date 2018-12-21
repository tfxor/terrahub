# Features


## [Feature \#1](features/features1.md)

### Make it easier and faster to create reusable terraform configuration

```shell
$ mkdir ./thub-demo/ && cd ./thub-demo/

$ terrahub project -n "thub-demo"
✅ Project successfully initialized
```

More details [here](features/features1.md)


## [Feature \#2](features/features2.md)

### Simplify and distribute the way terraform configuration is executed

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

More details [here](features/features2.md)


## [Feature \#3](features/features3.md)

### Accelerate and automate the testing of terraform commands

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

More details [here](features/features3.md)


## [Feature \#4](features/features4.md)

### Integrate and manage any existing terraform configuration

```shell
$ cd ./security-terraform/

$ terrahub project -n "Security_Terraform"
✅ Project successfully initialized

$ terrahub component -n "iam-idp" -d ./iam-idp/
✅ Done
```

More details [here](features/features4.md)


## [Feature \#5](features/features5.md)

### Centralize cloud resources management through realtime dashboards

```shell
$ terrahub list --depth 4
💡 Querying cloud accounts, regions and services. It might take a while...
Compiling the list of cloud resources. Use --depth, -d option to view details about projects, accounts, regions and services.
[...]
✅ Done
```

More details [here](features/features5.md)


## [Feature \#6](features/features6.md)

### Streamline integration and deployment with built-in CI and CD processes

```
TBU
```

More details [here](features/features6.md)


## [Feature \#7](features/features7.md)

### NO NEED to expose your private network to outside world at all

```
TBU
```

More details [here](features/features7.md)


## Return

Back to [readme](../README.md)

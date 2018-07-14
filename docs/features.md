# Features


## [1. Make it easier and faster to create reusable terraform code](features/features1.md)
```
$ mkdir ./thub-demo && cd ./thub-demo

$ terrahub project -n "thub-demo"
✅ Project successfully initialized
```

More details [here](features/features1.md)


## [2. Simplify and distribute the way terraform code is executed](features/features2.md)
```
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


## [3. Accelerate and automate the testing of terraform commands](features/features3.md)
```
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


## [4. Integrate and manage any existing terraform code](features/features4.md)
```
$ cd ./security-terraform

$ terrahub project -n "Security_Terraform"
✅ Project successfully initialized

$ terrahub component -n "iam" -d iam/
✅ Done
```

More details [here](features/features4.md)


## [5. Centralize cloud resources management through realtime dashboards](features/features5.md)
```
$ terrahub list --depth 4
💡 Querying cloud accounts, regions and services. It might take a while...
Compiling the list of cloud resources. Use --depth, -d option to view details about projects, accounts, regions and services.
[...]
✅ Done
```

More details [here](features/features5.md)

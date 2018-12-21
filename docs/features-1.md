# Features

## [1. Make it easier and faster to create reusable terraform configuration](features/features1.md)

```text
$ mkdir ./thub-demo/ && cd ./thub-demo/

$ terrahub project -n "thub-demo"
✅ Project successfully initialized
```

More details [here](features/features1.md)

## [2. Simplify and distribute the way terraform configuration is executed](features/features2.md)

```text
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

```text
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

## [4. Integrate and manage any existing terraform configuration](features/features4.md)

```text
$ cd ./security-terraform/

$ terrahub project -n "Security_Terraform"
✅ Project successfully initialized

$ terrahub component -n "iam-idp" -d ./iam-idp/
✅ Done
```

More details [here](features/features4.md)

## [5. Centralize cloud resources management through realtime dashboards](features/features5.md)

```text
$ terrahub list --depth 4
💡 Querying cloud accounts, regions and services. It might take a while...
Compiling the list of cloud resources. Use --depth, -d option to view details about projects, accounts, regions and services.
[...]
✅ Done
```

More details [here](features/features5.md)

## [6. Streamline integration and deployment with built-in CI and CD processes](features/features6.md)

```text
TBU
```

More details [here](features/features6.md)

## [7. NO NEED to expose your private network to outside world at all](features/features7.md)

```text
TBU
```

More details [here](features/features7.md)

## Return

Back to [readme](https://github.com/TerraHubCorp/terrahub/tree/a9d1822eae83783b84e5398738e2812effddc46d/docs/readme.md)


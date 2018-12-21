# Structure

```text
your-project
├─ .terrahub
│  ├─ s3
│  │  ├── .terrahub.yml
│  │  ├── README.md
│  │  ├── default.tfvars
│  │  ├── main.tf
│  │  ├── output.tf
│  │  ├── provider.tf
│  │  └── variables.tf
│  ├─ cloudfront
│  │  ├── .terrahub.yml
│  │  ├── README.md
│  │  ├── default.tfvars
│  │  ├── main.tf
│  │  ├── output.tf
│  │  ├── provider.tf
│  │  └── variables.tf
├─ .terrahub.yml
├─ src
└─ ...
```

> NOTE: **AVOID terraform configurations in root of your project!**


## Return
Back to [readme](readme.md)

# Structure

### Terraform compatible declaration

In order to be able to switch between `terrahub` and pure `terraform` the only thing you have to add - `.terrahub.yml`
per component.

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

### Terrahub specific declaration

If you decided to use `terrahub` and not going to switch back to plain `terraform`, you can declare everything in 
`.terrahub.yml` as component template:

```yaml
component:
  name: 'jit_component'
  template:
    provider:
      aws:
        profile: 'saml'
        region: '${var.region}'
    
    variable:
      region:
        description: 'This is the AWS region.'
    
    tfvars:
      region: 'us-east-1'
    
    data:
      aws_iam_policy_document:
        jit_component_assume_role_policy:
          statement:
            - actions: ['sts:AssumeRole']
              principals:
                type: 'Service'
                identifiers: ['*']
    
    resource:
      aws_iam_role:
        jit_component_role:
          name: 'jit_component_assume_role'
          assume_role_policy: '${data.aws_iam_policy_document.jit_component_assume_role_policy.json}'
```

To make working with terrahub a pleasure we also adding into `locals` some additional info like:

```json
{
  "timestamp": 1544222111000,
  "component": {
    "name": "jit_component",
    "path": "/User/username/projects/current/jit_component"
  },
  "project": {
    "path": "/User/username/projects/current",
    "name": "Jit_docs",
    "code": "abcd1234"
  }
}
```

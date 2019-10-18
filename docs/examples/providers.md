# Terraform providers

### File system

Just follow the [terraform][1] documentation.

### Templates using cached HCL

General use-case (w/ `alias` example):

```yaml
component:
  (...)
  template:
    provider:
      - aws:
          region: 'us-east-1'
          version: '~> 1.0'
      - aws:
          alias: 'profiled'
          profile: 'saml'
          region: 'us-east-1'
```

In case you use only one provider, you can use simplified option:

```yaml
component:
  (...)
  template:
    provider:
      aws:
        region: 'us-east-1'
        version: '~> 1.0'
```

[1]: https://www.terraform.io/docs/configuration/providers.html

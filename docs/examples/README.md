# Examples

TerraHub CLI is built using [nodejs](https://nodejs.org) and published using [npm](https://www.npmjs.com). Quick steps to get started:
```shell
$ node -v
v8.10.0
$ npm -v
v5.6.0
$ npm install -g terrahub
~/.nvm/versions/node/v8.10.0/lib
└── terrahub@0.0.1
$ terrahub -h
```

> NOTE: [TerraHub CLI](https://www.npmjs.com/package/terrahub) doesn't magically collect your data and upload to [TerraHub API](https://www.terrahub.io), which is further visualized in [TerraHub Console](https://console.terrahub.io). In order to do that, please sign up for a free account at [console.terrahub.io](https://console.terrahub.io) and navigate to [Settings](https://console.terrahub.io/settings) page to copy TerraHub Token. Next, you can setup TerraHub Token as `THUB_TOKEN` environmental variable or update `token` value in global config file - `$HOME/.terrahub/.terrahub.json`.

* [Terraform Automation Demo using AWS Cloud Provider](https://github.com/TerraHubCorp/terraform-aws-automation-demo)
* [Terraform Automation Demo using Google Cloud Provider](https://github.com/TerraHubCorp/terraform-google-automation-demo)

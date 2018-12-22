# Install

Getting started with TerraHub CLI is pretty straightforward.

1. Check if `node` is installed:

```shell
node -v
```

The output should look similar to the one below (do not copy paste):

```text
v6.10.0
```

> NOTE: If node is missing, check out [Installing Node.js via package manager](https://nodejs.org/en/download/package-manager/)

2. Next, check if `npm` is installed:

```shell
npm -v
```

The output should look similar to the one below (do not copy paste):

```text
v3.10.0
```

> NOTE: If npm is missing, check out [Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

3. Finally, install `terrahub`:

```shell
npm install -g terrahub
```

The output should look similar to the one below (do not copy paste):

```text
~/.nvm/versions/node/v6.10.0/lib
└── terrahub@0.0.1
```

4. Test if `terrahub` cli was installed properly:

```shell
terrahub --help
```

> NOTE: [TerraHub CLI](https://www.npmjs.com/package/terrahub) doesn't magically collect your data and upload to [TerraHub API](https://www.terrahub.io), which is further visualized in [TerraHub Console](https://console.terrahub.io). In order to do that, please sign up for a free account at [console.terrahub.io](https://console.terrahub.io) and navigate to [Settings](https://console.terrahub.io/settings) page to copy TerraHub Token. Next, you can setup TerraHub Token as `THUB_TOKEN` environmental variable or update `token` value in global config file - `$HOME/.terrahub/.terrahub.json`.


## Go Back

[Go Back to Getting Started](README.md)

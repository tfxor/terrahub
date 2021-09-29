# Install and Configure

Getting started with TerraHub CLI is pretty straightforward:

1. Next, check if `npm` is installed:

  ```shell
  npm --version
  ```

  The output should look similar to the one below (no need to copy paste):

  ```text
  v5.6.0
  ```

  > NOTE: If `npm` is missing, check out [Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

2. Install `terrahub` globally using `npm`:

  ```shell
  npm install --global terrahub
  ```

  The output should look similar to the one below (no need to copy paste):

  ```text
  ~/.nvm/versions/node/v8.10.0/lib
  └── terrahub@0.0.1
  ```

3. Test if `terrahub` cli was installed properly:

  ```shell
  terrahub --help
  ```

  > NOTE: [TerraHub CLI](https://www.npmjs.com/package/terrahub) doesn't magically collect your data and upload to [TerraHub API](https://www.terrahub.io/api), which is further visualized in [TerraHub Console](https://console.terrahub.io). In order to do that, please sign up for a free account at [console.terrahub.io](https://console.terrahub.io) and navigate to [Settings](https://console.terrahub.io/settings) page to copy TerraHub Token. Next, setup TerraHub Token as `TERRAHUB_TOKEN` environmental variable or update `token` value in global config file - `$HOME/.terrahub/.terrahub.json`.

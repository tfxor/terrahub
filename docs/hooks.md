# Hooks

In order to provide you the best experience we have implemented hooks functionality for following actions: 

* `terraform init`
* `terraform workspace`
* `terraform plan`
* `terraform apply`
* `terraform destroy`

All the hooks should return a Promise and look like: 

* before hook:

```javascript
/**
 * @param {Object} moduleConfig
 * @returns {Promise}
 */
function hook(moduleConfig) {
  return Promise.resolve();
}

module.exports = hook;
```

* after hook:

```javascript
/**
 * @param {Object} moduleConfig
 * @param {Buffer} cmdResult
 * @returns {Promise}
 */
function hook(moduleConfig, cmdResult) {
  return Promise.resolve();
}

module.exports = hook;
```

Configuration example for plan (`.terrahub.json`):

```text
"hooks": {
    "plan": {
        "before": "./hooks/plan/before.js",
        "after": "./hooks/plan/after.js"
    }
}
```

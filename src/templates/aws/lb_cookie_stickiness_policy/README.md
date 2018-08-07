# aws_lb_cookie_stickiness_policy

Provides a load balancer cookie stickiness policy, which allows an ELB to control the sticky session lifetime of the browser.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|lb_cookie_stickiness_policy_name|The name of the stickiness policy.|string|{{ name }}|No|
|lb_cookie_stickiness_policy_load_balancer|The load balancer to which the policy should be attached.|string||Yes|
|lb_cookie_stickiness_policy_lb_port|The load balancer port to which the policy should be applied. This must be an active listener on the load balancer.|number||Yes|
|lb_cookie_expiration_period|The time period after which the session cookie should be considered stale, expressed in seconds.|number|300|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the policy.|string|
|thub_id|The ID of the policy (hotfix for issue hashicorp/terraform#[7982]).|string|
|name|The name of the stickiness policy.|string|
|load_balancer|The load balancer to which the policy is attached.|string|
|lb_port|The load balancer port to which the policy is applied.|number|
|cookie_expiration_period|The time period after which the session cookie is considered stale, expressed in seconds.|number|

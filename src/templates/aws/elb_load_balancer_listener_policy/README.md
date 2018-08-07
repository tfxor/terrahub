# aws_elb_load_balancer_listener_policy

Attaches a load balancer policy to an ELB Listener.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|load_balancer_backend_server_policy_lb_name|The load balancer to attach the policy to.|string||Yes|
|load_balancer_backend_server_policy_lb_port|The load balancer listener port to apply the policy to.|number||Yes|
|load_balancer_listener_policy_names|List of Policy Names to apply to the backend server.|list||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the policy.|string|
|thub_id|The ID of the policy (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|
|load_balancer_name|The load balancer on which the policy is defined.|string|
|load_balancer_port|The load balancer listener port the policies are applied to.|list|

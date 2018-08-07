# aws_proxy_protocol_policy

Provides a proxy protocol policy, which allows an ELB to carry a client connection information to a backend.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|proxy_protocol_policy_load_balancer|The load balancer to which the policy should be attached.|string||Yes|
|proxy_protocol_policy_instance_ports|List of instance ports to which the policy should be applied. This can be specified if the protocol is SSL or TCP.|list||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the policy.|string|
|thub_id|The ID of the policy (matches id; hotfix for issue hashicorp/terraform#[7982]).|string|
|load_balancer|The load balancer to which the policy is attached.|string|

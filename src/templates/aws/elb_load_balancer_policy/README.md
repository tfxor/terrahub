# aws_elb_load_balancer_policy

Provides a load balancer policy, which can be attached to an ELB listener or backend server.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|lb_policy_lb_name|The load balancer on which the policy is defined.|string||Yes|
|lb_policy_name|The name of the load balancer policy.|string||Yes|
|lb_policy_type_name|The policy type.|string|SSLNegotiationPolicyType|No|
|lb_policy_attribute|Policy attribute to apply to the policy.|map|{name  = "Protocol-TLSv1.2" value = "true" }|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the policy.|string|
|policy_name|The name of the stickiness policy.|string|
|policy_type_name|The policy type of the policy.|string|
|load_balancer_name|The load balancer on which the policy is defined.|string|

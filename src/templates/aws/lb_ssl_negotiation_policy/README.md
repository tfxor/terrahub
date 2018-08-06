# aws_lb_ssl_negotiation_policy

Provides a load balancer SSL negotiation policy, which allows an ELB to control the ciphers and protocols that are supported during SSL negotiations between a client and a load balancer.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|lb_ssl_negotiation_policy_name|The name of the SSL negotiation policy.|string|{{ name }}|No|
|lb_ssl_negotiation_policy_lb|The load balancer to which the policy should be attached.|string||Yes|
|lb_ssl_negotiation_policy_lb_port|The load balancer port to which the policy should be applied. This must be an active listener on the load balancer.|number|443|No|
|lb_ssl_negotiation_policy_attribut|An SSL Negotiation policy attribute. Each has two properties: name - The name of the attribute, value - The value of the attribute|map|{name  = "Protocol-TLSv1.2" value = "true" }|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the policy.|string|
|thub_id|The ID of the policy.|string|
|name|The name of the stickiness policy.|string|
|load_balancer|The load balancer to which the policy is attached.|string|
|lb_port|The load balancer port to which the policy is applied.|number|
|attribute|The SSL Negotiation policy attributes.|map|

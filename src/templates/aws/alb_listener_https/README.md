# aws_lb_listener

Provides a Load Balancer Listener resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|lb_listener_load_balancer_arn|The ARN of the load balancer.|string||Yes|
|lb_listener_port|The port on which the load balancer is listening.|string|443|No|
|lb_listener_protocol|The protocol for connections from clients to the load balancer. Valid values are TCP, HTTP and HTTPS.|string|HTTPS|No|
|lb_listener_ssl_policy|The name of the SSL Policy for the listener. Required if protocol is HTTPS.|string|ELBSecurityPolicy-2015-05|No|
|lb_listener_certificate_name|The NAME of the default SSL server certificate.|string||Yes|
|lb_listener_target_group_arn|The ARN of the Target Group to which to route traffic.|string||Yes|
|lb_listener_type|The type of routing action. The only valid value is forward.|string|forward|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ARN of the listener (matches arn).|string|
|arn|The ARN of the listener (matches id).|string|

# aws_lb_listener

Provides a Load Balancer Listener resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|lb_listener_load_balancer_arn|The ARN of the load balancer.|string||Yes|
|lb_listener_port|The port on which the load balancer is listening.|string|80|No|
|lb_listener_protocol|The protocol for connections from clients to the load balancer. Valid values are TCP, HTTP and HTTPS.|string|HTTP|No|
|lb_listener_target_group_arn|The ARN of the Target Group to which to route traffic.|string||Yes|
|lb_listener_type|The type of routing action. The only valid value is forward.|string|forward|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ARN of the listener (matches arn).|string|
|thub_id|The ARN of the listener (matches arn).|string|
|arn|The ARN of the listener (matches id).|string|

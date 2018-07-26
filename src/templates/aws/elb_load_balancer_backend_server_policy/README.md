# aws_elb_load_balancer_backend_server_policy

Attaches a load balancer policy to an ELB backend server.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|load_balancer_backend_server_policy_load_balancer_name|The load balancer to attach the policy to.|string||Yes|
|load_balancer_backend_server_policy_instance_port|The instance port to apply the policy to.|number||Yes|
|load_balancer_backend_server_policy_names|List of Policy Names to apply to the backend server.|list||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The ID of the policy.|string|
|load_balancer_name|The load balancer on which the policy is defined.|string|
|instance_port|The backend port the policies are applied to.|list|

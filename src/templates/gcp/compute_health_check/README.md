# compute_helth_check

Health check for compute instance

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|project|Project name.|string||Yes|
|name|Health check name.|string|autohealing-health-check-http|Yes|
|check_interval_sec|Health check interval, sec.|int|5|No|
|timeout_sec|Health check timeout.|int|5|No|
|healthy_threshold|Healthy threshold.|int|2|No|
|unhealthy_threshold|Unhealthy threshold.|int|10|No|
|request_path|Request path.|string|"/"|No|
|port|Request port.|int|80|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|

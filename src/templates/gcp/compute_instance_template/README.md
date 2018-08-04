# compute_instance_tempate

Manages a VM instance template resource within GCE.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|project_id|Project ID.|string||Yes|
|name|Template name.|string||No|
|description|Template description.|string||No|
|instance_description|Instance description.|string||No|
|machine_type|Instance type.|string||Yes|
|can_ip_forward|Send/Receive packets with non-matching source or destination IPs.|string|False|No|
|disk_source_image|Disk source image.|string||No|
|disk_auto_delete|Disk auto-delete.|string|true|No|
|disk_boot|Indicates that this is a boot disk.|string||No|
|network_interface_network|The name or self_link of the network.|string||No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|


# cloudwatch_log_metric_filter

Provides a CloudWatch Log Metric Filter resource.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|cw_log_metric_filter_name|A name for the metric filter.|string|{{ name }}|No|
|cw_log_metric_filter_pattern|A valid CloudWatch Logs filter pattern for extracting metric data out of ingested log events.|string||No|
|cw_log_metric_filter_log_group_name|The name of the log group to associate the metric filter with.|string||Yes|
|cw_log_metric_transformation_name|The name of the CloudWatch metric to which the monitored log information should be published (e.g. ErrorCount)|string|EventCount|No|
|cw_log_metric_transformation_namespace|The destination namespace of the CloudWatch metric.|string|MyNamespace|No|
|cw_log_metric_transformation_value|What to publish to the metric. For example, if you're counting the occurrences of a particular term like "Error", the value will be "1" for each occurrence. If you're counting the bytes transferred the published value will be the value in the log event.|string|1|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|cloudwatch_log_metric_filter_id|The name of the metric filter.|string|
|cloudwatch_log_metric_filter_metric_transformation|A block defining collection of information needed to define how metric data gets emitted.|object|

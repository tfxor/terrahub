# kinesis_stream

Provides a Kinesis Stream resource. Amazon Kinesis is a managed service that scales elastically for real-time processing of streaming big data.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|kinesis_stream_name|The name of the API key.|string|{{ name }}|No|
|kinesis_stream_shard_count|The number of shards that the stream will use. Amazon has guidlines for specifying the Stream size that should be referenced when creating a Kinesis stream.|string|1|No|
|kinesis_stream_retention_period|Length of time data records are accessible after they are added to the stream. The maximum value of a stream's retention period is 168 hours.|string|48|No|
|kinesis_stream_shard_level_metrics|A list of shard-level CloudWatch metrics which can be enabled for the stream. See Monitoring with CloudWatch for more. Note that the value ALL should not be used; instead you should provide an explicit list of metrics you wish to enable.|array|"IncomingBytes", "OutgoingBytes"|No|
|kinesis_stream_encryption_type|The encryption type to use. The only acceptable values are NONE or KMS.|string|NONE|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|


## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|kinesis_stream_id|The unique Stream id.|string|
|kinesis_stream_name|The unique Stream name.|string|
|kinesis_stream_shard_count|The count of Shards for this Stream.|string|
|kinesis_stream_arn|The Amazon Resource Name (ARN) specifying the Stream.|string|
|kinesis_stream_shard_level_metrics|A list of shard-level CloudWatch metrics which can be enabled for the stream. See Monitoring with CloudWatch for more.|array|
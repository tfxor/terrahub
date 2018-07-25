# aws_autoscaling_notification

Provides an AutoScaling Group with Notification support, via SNS Topics. Each of the notifications map to a Notification Configuration inside Amazon Web Services, and are applied to each AutoScaling Group you supply.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|autoscaling_notification_group_names|A list of AutoScaling Group Names.|list||Yes|
|autoscaling_notification_notifications|A list of Notification Types that trigger notifications. Acceptable values are documented .|list||Yes|
|autoscaling_notification_topic_arn|The Topic ARN for notifications to be sent through.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|group_names|A list of AutoScaling Group Names.|list|
|notifications|A list of Notification Types that trigger notifications. Acceptable values are documented .|list|
|topic_arn|The Topic ARN for notifications to be sent through.|string|

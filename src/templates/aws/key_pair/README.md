# aws_key_pair
Provides an EC2 key pair resource. A key pair is used to control login access to EC2 instances.

Currently this resource requires an existing user-supplied key pair. This key pair's public key will be registered with AWS to allow logging-in to EC2 instances.

When importing an existing key pair the public key material may be in any format supported by AWS. Supported formats (per the AWS documentation) are:

OpenSSH public key format (the format in ~/.ssh/authorized_keys)
Base64 encoded DER format
SSH public key file format as specified in RFC4716

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|key_pair_name|The name for the key pair.|string|{{ name }}|No|
|key_pair_public_key|The public key material.|string||Yes|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|key_name|The key pair name.|string|
|fingerprint|The MD5 public key fingerprint as specified in section 4 of RFC 4716.|string|

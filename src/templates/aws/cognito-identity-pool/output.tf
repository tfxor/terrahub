# Define list of variables to be output

output "cognito_identity_pool_name" {
  value = "${aws_cognito_identity_pool.{{ name }}.identity_pool_name}"
}


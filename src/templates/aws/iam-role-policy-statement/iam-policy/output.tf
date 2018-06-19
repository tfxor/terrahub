# Define list of variables to be output

output "aws_policy_arn" {
  value = "${aws_iam_policy.iam_policy.arn}"
}

output "aws_policy_id" {
  value = "${aws_iam_policy.iam_policy.id}"
}

output "aws_policy_name" {
  value = "${aws_iam_policy.iam_policy.name}"
}

output "aws_policy_path" {
  value = "${aws_iam_policy.iam_policy.path}"
}

output "aws_policy_policy" {
  value = "${aws_iam_policy.iam_policy.policy}"
}

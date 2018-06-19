output "policy_json" {
  value = "${data.aws_iam_policy_document.statement.json}"
}

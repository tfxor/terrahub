data "aws_iam_policy_document" "statement" {
  override_json = "${data.aws_iam_policy_document.statement_01.json}"

  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface"]
    resources = ["*"] 
  }
}

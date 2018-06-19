data "aws_iam_policy_document" "statement_02" {
  statement {
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams"]
    resources = ["*"]
  }
}

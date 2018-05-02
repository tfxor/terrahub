module "statements" {
  source = "./statements"

  providers = {
    aws = "aws.default"
  }
}

resource "aws_iam_policy" "iam_policy" {
  name        = "${var.iam_policy_name}"
  description = "${var.iam_policy_description}"
  path        = "${var.iam_policy_path}"
  policy      = "${module.statements.policy_json}"
}

data "aws_iam_policy_document" "iam_role_policy" {
  statement {
    sid     = "${var.iam_role_policy_sid}"
    actions = "${var.iam_role_policy_actions}"

    principals = {
      type        = "${var.iam_role_policy_principals_type}"
      identifiers = "${var.iam_role_policy_principals_identifiers}"
    }

    effect = "${var.iam_role_policy_effect}"
  }
}

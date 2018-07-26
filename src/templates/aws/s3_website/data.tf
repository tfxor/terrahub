data "aws_iam_policy_document" "default_assume_s3_policy" {
  statement {
  	sid = "bucket_policy_site_main"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = ["s3:GetObject"]

    resources = [
      "arn:aws:s3:::${var.s3_bucket_name}/*",
    ]
  }
}

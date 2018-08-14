provider "aws" {
  version = "~> 1.0"
  region  = "${var.region}"

  allowed_account_ids = ["${var.account_id}"]
}

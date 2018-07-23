data "terraform_remote_state" "network" {
  backend = "local"

  config {
    path = "${path.module}/../terrahub-demo-network/.resource/terraform.tfstate"
  }
}

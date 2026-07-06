terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "user_arn" {
  value = data.aws_caller_identity.current.arn
}
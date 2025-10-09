terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data source for existing VPC
data "aws_vpc" "existing" {
  id = var.vpc_id
}

# Get VPC CIDR block for subnet creation
data "aws_vpc" "selected" {
  id = var.vpc_id
}
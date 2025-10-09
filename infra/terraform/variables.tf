variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_id" {
  description = "Existing VPC ID"
  type        = string
  default     = "vpc-0e23a80099b2d4ec2"
}

variable "ecr_registry" {
  description = "ECR public registry URL"
  type        = string
  default     = "public.ecr.aws/x6i8o2b8"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "dragondb_dev"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "dragonuser_dev"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "Auth secret key"
  type        = string
  sensitive   = true
}


variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b"]
}

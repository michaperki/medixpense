# infrastructure/terraform/main.tf
provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "./modules/vpc"
  # VPC configurations
}

module "rds" {
  source = "./modules/rds"
  # RDS configurations
}

module "ecs" {
  source = "./modules/ecs"
  # ECS configurations for containers
}

module "s3" {
  source = "./modules/s3"
  # S3 configurations for static assets
}

module "cloudfront" {
  source = "./modules/cloudfront"
  # CloudFront configurations for CDN
}

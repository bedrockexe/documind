data "aws_caller_identity" "current" {}

# The role your EC2 instance will assume
resource "aws_iam_role" "ec2_ssm" {
  name = "${var.project}-ec2-ssm-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = { Name = "${var.project}-ec2-ssm-role" }
}

# Permission: read ONLY your /documind/* parameters, nothing else
resource "aws_iam_role_policy" "ssm_read" {
  name = "${var.project}-ssm-read"
  role = aws_iam_role.ec2_ssm.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ]
      Resource = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/documind/*"
    }]
  })
}

# The instance profile is the wrapper that lets the instance actually use the role
resource "aws_iam_instance_profile" "ec2_ssm" {
  name = "${var.project}-ec2-ssm-profile"
  role = aws_iam_role.ec2_ssm.name
}
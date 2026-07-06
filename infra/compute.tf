# Look up the newest official Ubuntu 24.04 image (no hardcoded AMI IDs)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Upload your public key so you can SSH in
resource "aws_key_pair" "main" {
  key_name   = "${var.project}-key"
  public_key = file(pathexpand("~/.ssh/documind-key.pub"))
}

# The server itself
resource "aws_instance" "web" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = aws_key_pair.main.key_name

  root_block_device {
    volume_size = 30       # GB — room for OS + Docker images
    volume_type = "gp3"    # cheapest good disk
  }

  tags = { Name = "${var.project}-server" }
}

# A static public IP so your demo URL survives restarts
resource "aws_eip" "web" {
  instance   = aws_instance.web.id
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]
  tags = { Name = "${var.project}-eip" }
}

output "server_ip"   { value = aws_eip.web.public_ip }
output "ssh_command" { value = "ssh -i ~/.ssh/documind-key ubuntu@${aws_eip.web.public_ip}" }
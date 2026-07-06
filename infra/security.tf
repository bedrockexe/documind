# The firewall for your server
resource "aws_security_group" "web" {
  name        = "${var.project}-web-sg"
  description = "SSH from me, app ports from anyone"
  vpc_id      = aws_vpc.main.id
  tags = { Name = "${var.project}-web-sg" }
}

# SSH — only from YOUR IP
resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.web.id
  description       = "SSH from my machine"
  cidr_ipv4         = var.my_ip
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
}

# Frontend on port 80 — from anyone
resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.web.id
  description       = "HTTP frontend"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

# Frontend on port 3000 (your compose mapping) — from anyone
resource "aws_vpc_security_group_ingress_rule" "frontend_3000" {
  security_group_id = aws_security_group.web.id
  description       = "Frontend on 3000"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 3000
  to_port           = 3000
  ip_protocol       = "tcp"
}

# Backend API on 8000 (the browser calls it directly) — from anyone
resource "aws_vpc_security_group_ingress_rule" "backend_8000" {
  security_group_id = aws_security_group.web.id
  description       = "Backend API"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 8000
  to_port           = 8000
  ip_protocol       = "tcp"
}

# Allow all outbound (so the box can pull images, reach Groq, etc.)
resource "aws_vpc_security_group_egress_rule" "all_out" {
  security_group_id = aws_security_group.web.id
  description       = "All outbound"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

output "security_group_id" { value = aws_security_group.web.id }
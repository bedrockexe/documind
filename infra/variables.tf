variable "project" {
  description = "Name prefix for all resources"
  type        = string
  default     = "documind"
}

variable "my_ip" {
  description = "Your public IP in CIDR form, e.g. 203.0.113.10/32 — used to allow SSH only from you"
  type        = string
}
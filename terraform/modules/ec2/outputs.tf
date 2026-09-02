output "instance_id" {
  value = aws_instance.server.id
}

output "public_ip" {
  value = aws_eip.eip.public_ip
}

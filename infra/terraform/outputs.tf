output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.dragon_cluster.name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.dragon_postgres.endpoint
}

output "rds_address" {
  description = "RDS instance address"
  value       = aws_db_instance.dragon_postgres.address
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = aws_ecs_service.backend_service.name
}

output "frontend_service_name" {
  description = "Frontend ECS service name"
  value       = aws_ecs_service.frontend_service.name
}

output "backend_security_group_id" {
  description = "Backend security group ID"
  value       = aws_security_group.dragon_backend_sg.id
}

output "frontend_security_group_id" {
  description = "Frontend security group ID"
  value       = aws_security_group.dragon_frontend_sg.id
}

output "db_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.dragon_db_sg.id
}

output "subnet_a_id" {
  description = "Subnet A ID"
  value       = aws_subnet.dragon_subnet_a.id
}

output "subnet_b_id" {
  description = "Subnet B ID"
  value       = aws_subnet.dragon_subnet_b.id
}

output "get_backend_ip_command" {
  description = "Command to get backend task public IP"
  value       = "aws ecs list-tasks --cluster ${aws_ecs_cluster.dragon_cluster.name} --service-name ${aws_ecs_service.backend_service.name} --region ${var.aws_region} --query 'taskArns[0]' --output text | xargs -I {} aws ecs describe-tasks --cluster ${aws_ecs_cluster.dragon_cluster.name} --tasks {} --region ${var.aws_region} --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --region ${var.aws_region} --query 'NetworkInterfaces[0].Association.PublicIp' --output text"
}

output "get_frontend_ip_command" {
  description = "Command to get frontend task public IP"
  value       = "aws ecs list-tasks --cluster ${aws_ecs_cluster.dragon_cluster.name} --service-name ${aws_ecs_service.frontend_service.name} --region ${var.aws_region} --query 'taskArns[0]' --output text | xargs -I {} aws ecs describe-tasks --cluster ${aws_ecs_cluster.dragon_cluster.name} --tasks {} --region ${var.aws_region} --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --region ${var.aws_region} --query 'NetworkInterfaces[0].Association.PublicIp' --output text"
}
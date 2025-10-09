# DB Subnet Group
resource "aws_db_subnet_group" "dragon_db_subnet_group" {
  name       = "dragon-db-subnet-group-${var.environment}"
  subnet_ids = [aws_subnet.dragon_subnet_a.id, aws_subnet.dragon_subnet_b.id]

  tags = {
    Name        = "dragon-db-subnet-group-${var.environment}"
    Environment = var.environment
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "dragon_postgres" {
  identifier             = "dragon-postgres-${var.environment}"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.dragon_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.dragon_db_sg.id]

  publicly_accessible = false
  skip_final_snapshot = true  # For dev environment only

  backup_retention_period = 0  # No backups for dev

  tags = {
    Name        = "dragon-postgres-${var.environment}"
    Environment = var.environment
  }
}
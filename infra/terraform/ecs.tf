# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend_logs" {
  name              = "/ecs/dragon-backend-${var.environment}"
  retention_in_days = 7

  tags = {
    Name        = "dragon-backend-logs-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "frontend_logs" {
  name              = "/ecs/dragon-frontend-${var.environment}"
  retention_in_days = 7

  tags = {
    Name        = "dragon-frontend-logs-${var.environment}"
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "dragon_cluster" {
  name = "dragon-app-cluster-${var.environment}"

  tags = {
    Name        = "dragon-app-cluster-${var.environment}"
    Environment = var.environment
  }
}

# Backend Task Definition
resource "aws_ecs_task_definition" "backend_task" {
  family                   = "dragon-backend-task-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "dragon-backend"
      image     = "${var.ecr_registry}/dragon-backend:${var.environment}"
      essential = true

      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "DEBUG"
          value = "True"
        },
        {
          name  = "DB_NAME"
          value = var.db_name
        },
        {
          name  = "DB_USER"
          value = var.db_username
        },
        {
          name  = "DB_PASSWORD"
          value = var.db_password
        },
        {
          name  = "DB_HOST"
          value = aws_db_instance.dragon_postgres.address
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "ALLOWED_HOSTS"
          value = "*"
        },
        {
          name  = "CORS_ALLOW_ALL_ORIGINS"
          value = "True"
        },
        {
          name  = "SECRET_KEY"
          value = var.secret_key
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "dragon-backend-task-${var.environment}"
    Environment = var.environment
  }
}

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend_task" {
  family                   = "dragon-frontend-task-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "dragon-frontend"
      image     = "${var.ecr_registry}/dragon-frontend:${var.environment}"
      essential = true

      portMappings = [
        {
          containerPort = 5173
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "VITE_API_URL"
          value = "http://${aws_ecs_service.backend_service.name}.${var.aws_region}.amazonaws.com:8000"
        },
        {
          name  = "NODE_ENV"
          value = "development"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "dragon-frontend-task-${var.environment}"
    Environment = var.environment
  }
}

# Backend Service
resource "aws_ecs_service" "backend_service" {
  name            = "dragon-backend-service-${var.environment}"
  cluster         = aws_ecs_cluster.dragon_cluster.id
  task_definition = aws_ecs_task_definition.backend_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.dragon_subnet_a.id, aws_subnet.dragon_subnet_b.id]
    security_groups  = [aws_security_group.dragon_backend_sg.id]
    assign_public_ip = true
  }

  tags = {
    Name        = "dragon-backend-service-${var.environment}"
    Environment = var.environment
  }
}

# Frontend Service
resource "aws_ecs_service" "frontend_service" {
  name            = "dragon-frontend-service-${var.environment}"
  cluster         = aws_ecs_cluster.dragon_cluster.id
  task_definition = aws_ecs_task_definition.frontend_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.dragon_subnet_a.id, aws_subnet.dragon_subnet_b.id]
    security_groups  = [aws_security_group.dragon_frontend_sg.id]
    assign_public_ip = true
  }

  tags = {
    Name        = "dragon-frontend-service-${var.environment}"
    Environment = var.environment
  }
}
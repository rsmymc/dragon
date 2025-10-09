# Subnets in different AZs
resource "aws_subnet" "dragon_subnet_a" {
  vpc_id                  = var.vpc_id
  cidr_block              = "172.31.62.0/24"  # Adjust based on your VPC CIDR
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "dragon-subnet-a-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_subnet" "dragon_subnet_b" {
  vpc_id                  = var.vpc_id
  cidr_block              = "172.31.63.0/24"  # Adjust based on your VPC CIDR
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "dragon-subnet-b-${var.environment}"
    Environment = var.environment
  }
}

/*# Internet Gateway (if not already exists in your VPC)
resource "aws_internet_gateway" "dragon_igw" {
  vpc_id = var.vpc_id

  tags = {
    Name        = "dragon-igw-${var.environment}"
    Environment = var.environment
  }
}*/

# Route Table
/*resource "aws_route_table" "dragon_route_table" {
  vpc_id = var.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dragon_igw.id
  }

  tags = {
    Name        = "dragon-route-table-${var.environment}"
    Environment = var.environment
  }
}*/

# Associate subnets with route table
/*resource "aws_route_table_association" "subnet_a" {
  subnet_id      = aws_subnet.dragon_subnet_a.id
  route_table_id = aws_route_table.dragon_route_table.id
}

resource "aws_route_table_association" "subnet_b" {
  subnet_id      = aws_subnet.dragon_subnet_b.id
  route_table_id = aws_route_table.dragon_route_table.id
}
*/

# Security Group for Database
resource "aws_security_group" "dragon_db_sg" {
  name        = "dragon-db-sg-${var.environment}"
  description = "Security group for Dragon database"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.dragon_backend_sg.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "dragon-db-sg-${var.environment}"
    Environment = var.environment
  }
}

# Security Group for Backend
resource "aws_security_group" "dragon_backend_sg" {
  name        = "dragon-backend-sg-${var.environment}"
  description = "Security group for Dragon backend"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Django from frontend"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.dragon_frontend_sg.id]
  }

  ingress {
    description = "Django from anywhere (for dev)"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "dragon-backend-sg-${var.environment}"
    Environment = var.environment
  }
}

# Security Group for Frontend
resource "aws_security_group" "dragon_frontend_sg" {
  name        = "dragon-frontend-sg-${var.environment}"
  description = "Security group for Dragon frontend"
  vpc_id      = var.vpc_id

  ingress {
    description = "Vite dev server from anywhere"
    from_port   = 5173
    to_port     = 5173
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "dragon-frontend-sg-${var.environment}"
    Environment = var.environment
  }
}
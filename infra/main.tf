# Production database for the gateway.
# Local dev uses SQLite (see the repo root); production runs on RDS Postgres.

provider "aws" {
  region = "eu-west-1"
}

resource "aws_security_group" "db" {
  name        = "gateway-db"
  description = "Postgres access for the integration gateway"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "gateway" {
  identifier             = "gateway"
  engine                 = "postgres"
  instance_class         = "db.t3.small"
  allocated_storage      = 20
  db_name                = "gateway"
  username               = "gateway_admin"
  password               = "Gateway-Prod-2024!"
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = true
  skip_final_snapshot    = true
}

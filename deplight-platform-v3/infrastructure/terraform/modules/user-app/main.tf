# User App Module - For deploying student projects with isolated infrastructure

# Data source to get existing ALB
data "aws_lb" "main" {
  name = var.alb_name
}

# Data source to get existing ECS cluster
data "aws_ecs_cluster" "main" {
  cluster_name = var.ecs_cluster_name
}

# Data source to get ALB listener
data "aws_lb_listener" "http" {
  load_balancer_arn = data.aws_lb.main.arn
  port              = 80
}

resource "aws_security_group" "user_app" {
  name_prefix = "${var.app_name}-"
  description = "Allow ALB traffic to ${var.app_name}"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [one(data.aws_lb.main.security_groups)]
    description     = "Allow application traffic from the platform ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name       = "${var.app_name}-sg"
    AppName    = var.app_name
    Repository = var.repository_url
    ManagedBy  = "Terraform"
  }
}

# Target Group for the user app
resource "aws_lb_target_group" "user_app" {
  name        = substr("${var.app_name}-tg", 0, 32) # AWS limit is 32 chars
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  deregistration_delay = 30

  tags = {
    Name       = "${var.app_name}-tg"
    AppName    = var.app_name
    Repository = var.repository_url
    ManagedBy  = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener Rule - Route traffic based on path pattern
resource "aws_lb_listener_rule" "user_app" {
  listener_arn = data.aws_lb_listener.http.arn
  priority     = var.listener_rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.user_app.arn
  }

  condition {
    path_pattern {
      values = ["/${var.path_prefix}", "/${var.path_prefix}/*"]
    }
  }

  transform {
    type = "url-rewrite"

    url_rewrite_config {
      rewrite {
        regex   = "^/${var.path_prefix}/?(.*)$"
        replace = "/$1"
      }
    }
  }

  tags = {
    Name       = "${var.app_name}-rule"
    AppName    = var.app_name
    Repository = var.repository_url
  }
}

# CloudWatch Log Group for user app
resource "aws_cloudwatch_log_group" "user_app" {
  name              = "/aws/ecs/user-apps/${var.app_name}"
  retention_in_days = var.log_retention_days

  tags = {
    Name       = "${var.app_name}-logs"
    AppName    = var.app_name
    Repository = var.repository_url
  }
}

# ECS Task Definition for user app
resource "aws_ecs_task_definition" "user_app" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = var.app_name
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = concat([
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "ENVIRONMENT"
          value = "production"
        },
        {
          name  = "BASE_URL_PATH"
          value = "/${var.path_prefix}"
        },
        {
          name  = "APP_NAME"
          value = var.app_name
        }
      ], var.environment_variables)

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.user_app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }

      # No container-level healthCheck: rely on ALB Target Group health checks
    }
  ])

  tags = {
    Name       = "${var.app_name}-task-def"
    AppName    = var.app_name
    Repository = var.repository_url
    ImageTag   = var.image_tag
  }
}

# ECS Service for user app
resource "aws_ecs_service" "user_app" {
  name                              = var.app_name
  cluster                           = data.aws_ecs_cluster.main.arn
  task_definition                   = aws_ecs_task_definition.user_app.arn
  desired_count                     = var.desired_count
  launch_type                       = "FARGATE"
  wait_for_steady_state             = true
  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.user_app.id]
    assign_public_ip = var.assign_public_ip
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.user_app.arn
    container_name   = var.app_name
    container_port   = var.container_port
  }

  # Use ECS deployment controller with circuit breaker for fast, safe deployments
  deployment_controller {
    type = "ECS"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  enable_ecs_managed_tags = true
  propagate_tags          = "SERVICE"

  depends_on = [
    aws_lb_listener_rule.user_app
  ]

  tags = {
    Name       = "${var.app_name}-service"
    AppName    = var.app_name
    Repository = var.repository_url
  }

}

# CloudWatch Alarms for user app
resource "aws_cloudwatch_metric_alarm" "user_app_cpu" {
  alarm_name          = "${var.app_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This alarm monitors CPU utilization for ${var.app_name}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = aws_ecs_service.user_app.name
  }

  tags = {
    Name       = "${var.app_name}-cpu-alarm"
    AppName    = var.app_name
    Repository = var.repository_url
  }
}

resource "aws_cloudwatch_metric_alarm" "user_app_memory" {
  alarm_name          = "${var.app_name}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This alarm monitors memory utilization for ${var.app_name}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = aws_ecs_service.user_app.name
  }

  tags = {
    Name       = "${var.app_name}-memory-alarm"
    AppName    = var.app_name
    Repository = var.repository_url
  }
}

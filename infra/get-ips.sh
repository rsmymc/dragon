#!/bin/bash

# Simple script to get current public IPs of backend and frontend tasks
# Useful for dev when tasks restart and get new IPs

AWS_REGION="us-east-2"
ENVIRONMENT="dev"

echo "🔍 Getting current task IPs..."
echo ""

# Get backend IP
echo "Backend Service:"
BACKEND_TASK_ARN=$(aws ecs list-tasks \
  --cluster dragon-app-cluster-$ENVIRONMENT \
  --service-name dragon-backend-service-$ENVIRONMENT \
  --region $AWS_REGION \
  --query 'taskArns[0]' \
  --output text)

if [ -z "$BACKEND_TASK_ARN" ] || [ "$BACKEND_TASK_ARN" == "None" ]; then
  echo "  ❌ Backend task not found"
else
  BACKEND_ENI_ID=$(aws ecs describe-tasks \
    --cluster dragon-app-cluster-$ENVIRONMENT \
    --tasks $BACKEND_TASK_ARN \
    --region $AWS_REGION \
    --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
    --output text)

  BACKEND_IP=$(aws ec2 describe-network-interfaces \
    --network-interface-ids $BACKEND_ENI_ID \
    --region $AWS_REGION \
    --query 'NetworkInterfaces[0].Association.PublicIp' \
    --output text)

  echo "  IP: $BACKEND_IP"
  echo "  URL: http://$BACKEND_IP:8000"
  echo "  API: http://$BACKEND_IP:8000/api/v1"
fi

echo ""

# Get frontend IP
echo "Frontend Service:"
FRONTEND_TASK_ARN=$(aws ecs list-tasks \
  --cluster dragon-app-cluster-$ENVIRONMENT \
  --service-name dragon-frontend-service-$ENVIRONMENT \
  --region $AWS_REGION \
  --query 'taskArns[0]' \
  --output text)

if [ -z "$FRONTEND_TASK_ARN" ] || [ "$FRONTEND_TASK_ARN" == "None" ]; then
  echo "  ❌ Frontend task not found"
else
  FRONTEND_ENI_ID=$(aws ecs describe-tasks \
    --cluster dragon-app-cluster-$ENVIRONMENT \
    --tasks $FRONTEND_TASK_ARN \
    --region $AWS_REGION \
    --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
    --output text)

  FRONTEND_IP=$(aws ec2 describe-network-interfaces \
    --network-interface-ids $FRONTEND_ENI_ID \
    --region $AWS_REGION \
    --query 'NetworkInterfaces[0].Association.PublicIp' \
    --output text)

  echo "  IP: $FRONTEND_IP"
  echo "  URL: http://$FRONTEND_IP:5173"
fi

echo ""
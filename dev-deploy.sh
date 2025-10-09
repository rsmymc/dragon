#!/bin/bash
set -e

# Dragon App - Complete Dev Deployment Script

AWS_REGION="us-east-2"
ECR_REGISTRY="public.ecr.aws/x6i8o2b8"
ENVIRONMENT="dev"

echo "🚀 Dragon App - Dev Deployment Script"
echo "======================================"
echo ""

# Step 1: Build and push backend
echo "📦 Step 1/8: Building and pushing backend..."
cd dragon_backend_django
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker build -t $ECR_REGISTRY/dragon-backend:$ENVIRONMENT .
docker push $ECR_REGISTRY/dragon-backend:$ENVIRONMENT
echo "✅ Backend image pushed"
cd ..

# Step 2: Build and push frontend (initial version with placeholder)
echo ""
echo "📦 Step 2/8: Building and pushing frontend (initial)..."
cd dragon_frontend_vue
docker build -f Dockerfile.aws -t $ECR_REGISTRY/dragon-frontend:$ENVIRONMENT .
docker push $ECR_REGISTRY/dragon-frontend:$ENVIRONMENT
echo "✅ Frontend image pushed (will rebuild with correct backend IP)"
cd ..

# Step 3: Deploy infrastructure (both services will start)
echo ""
echo "🏗️  Step 3/8: Deploying infrastructure with Terraform..."
cd infra/terraform
terraform init -input=false
terraform apply -auto-approve
echo "✅ Infrastructure deployed"
cd ../..

# Step 4: Wait for backend to be running
echo ""
echo "⏳ Step 4/8: Waiting for backend task to start (45 seconds)..."
sleep 45

# Step 5: Get backend public IP
echo ""
echo "🔍 Step 5/8: Getting backend public IP..."

TASK_ARN=$(aws ecs list-tasks \
  --cluster dragon-app-cluster-$ENVIRONMENT \
  --service-name dragon-backend-service-$ENVIRONMENT \
  --region $AWS_REGION \
  --query 'taskArns[0]' \
  --output text)

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
  echo "❌ Error: Backend task not found. Checking service status..."
  aws ecs describe-services \
    --cluster dragon-app-cluster-$ENVIRONMENT \
    --services dragon-backend-service-$ENVIRONMENT \
    --region $AWS_REGION \
    --query 'services[0].events[0:3]' \
    --output table
  exit 1
fi

ENI_ID=$(aws ecs describe-tasks \
  --cluster dragon-app-cluster-$ENVIRONMENT \
  --tasks $TASK_ARN \
  --region $AWS_REGION \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text)

BACKEND_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids $ENI_ID \
  --region $AWS_REGION \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

if [ -z "$BACKEND_IP" ] || [ "$BACKEND_IP" == "None" ]; then
  echo "❌ Error: Could not get backend public IP"
  echo "   ENI ID: $ENI_ID"
  exit 1
fi

echo "✅ Backend IP: $BACKEND_IP"

# Step 6: Update frontend .env with correct backend IP
echo ""
echo "📝 Step 6/8: Updating frontend environment with backend IP..."
cat > dragon_frontend_vue/.env.aws << EOF
VITE_API_BASE=http://$BACKEND_IP:8000/api/v1
NODE_ENV=development
EOF
echo "✅ Frontend .env.development updated"

# Step 7: Rebuild and push frontend with correct backend IP
echo ""
echo "🔄 Step 7/8: Rebuilding and pushing frontend with correct backend IP..."
cd dragon_frontend_vue
docker build -f Dockerfile.aws -t $ECR_REGISTRY/dragon-frontend:$ENVIRONMENT .
docker push $ECR_REGISTRY/dragon-frontend:$ENVIRONMENT
echo "✅ Frontend image pushed with correct backend IP"
cd ..

# Step 8: Force frontend service to pull new image (NOT terraform apply!)
echo ""
echo "🔄 Step 8/8: Updating frontend service with new image..."
aws ecs update-service \
  --cluster dragon-app-cluster-$ENVIRONMENT \
  --service dragon-frontend-service-$ENVIRONMENT \
  --force-new-deployment \
  --region $AWS_REGION \
  --output text > /dev/null
echo "✅ Frontend service update initiated"

# Wait for frontend to be running
echo ""
echo "⏳ Waiting for frontend task to start (45 seconds)..."
sleep 45

# Get frontend IP
echo ""
echo "🔍 Getting frontend public IP..."

FRONTEND_TASK_ARN=$(aws ecs list-tasks \
  --cluster dragon-app-cluster-$ENVIRONMENT \
  --service-name dragon-frontend-service-$ENVIRONMENT \
  --region $AWS_REGION \
  --query 'taskArns[0]' \
  --output text)

if [ -z "$FRONTEND_TASK_ARN" ] || [ "$FRONTEND_TASK_ARN" == "None" ]; then
  echo "⚠️  Warning: Frontend task not found yet. It may still be starting..."
  echo ""
  echo "======================================"
  echo "⚠️  Partial Deployment Complete"
  echo "======================================"
  echo ""
  echo "Backend:  http://$BACKEND_IP:8000"
  echo "Frontend: (still starting - check in a minute)"
  echo ""
  echo "To check frontend status:"
  echo "  ./get-ips.sh"
  echo ""
  exit 0
fi

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

echo ""
echo "======================================"
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "Backend:  http://$BACKEND_IP:8000"
echo "Frontend: http://$FRONTEND_IP:5173"
echo ""
echo "Backend API: http://$BACKEND_IP:8000/api/v1"
echo ""
echo "📝 Notes:"
echo "  • These IPs will change if services restart"
echo "  • Backend logs: aws logs tail /ecs/dragon-backend-dev --follow --region $AWS_REGION"
echo "  • Frontend logs: aws logs tail /ecs/dragon-frontend-dev --follow --region $AWS_REGION"
echo "  • Check IPs anytime: ./get-ips.sh"
echo ""
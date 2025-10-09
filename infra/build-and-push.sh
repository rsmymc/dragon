#!/bin/bash
set -e

# Configuration
AWS_REGION="us-east-1"  # ECR Public is always us-east-1
ECR_REGISTRY="public.ecr.aws/x6i8o2b8"
ENVIRONMENT="dev"

echo "🔐 Authenticating with ECR Public..."
aws ecr-public get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

#echo "🏗️  Building backend image..."
#cd ../dragon_backend_django
#docker build -t $ECR_REGISTRY/dragon-backend:$ENVIRONMENT .
#echo "✅ Backend image built"
#
#echo "📤 Pushing backend image..."
#docker push $ECR_REGISTRY/dragon-backend:$ENVIRONMENT
#echo "✅ Backend image pushed"
#cd ..

echo "🏗️  Building frontend image..."
cd ../dragon_frontend_vue
docker build -f Dockerfile.aws -t $ECR_REGISTRY/dragon-frontend:$ENVIRONMENT .
echo "✅ Frontend image built"

echo "📤 Pushing frontend image..."
docker push $ECR_REGISTRY/dragon-frontend:$ENVIRONMENT
echo "✅ Frontend image pushed"

echo "🎉 All images built and pushed successfully!"
echo ""
echo "Next steps:"
echo "  cd ../infra/terraform"
echo "  terraform init"
echo "  terraform apply"
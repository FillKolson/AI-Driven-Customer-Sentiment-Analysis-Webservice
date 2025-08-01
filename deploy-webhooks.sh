# Deploy the payments webhook without JWT verification
echo "Deploying payments-webhook function with JWT verification disabled..."
supabase functions deploy payments-webhook --no-verify-jwt

# Deploy the cancel-subscription function
echo "Deploying cancel-subscription function..."
supabase functions deploy cancel-subscription

# Deploy other necessary functions
echo "Deploying create-checkout function..."
supabase functions deploy create-checkout

echo "Deploying create-portal-session function..."
supabase functions deploy create-portal-session

echo "Deploying get-plans function..."
supabase functions deploy get-plans

echo "Deploying get-subscription-status function..."
supabase functions deploy get-subscription-status

echo "Deploying update-subscription function..."
supabase functions deploy update-subscription

echo "Deploying sentiment-analysis function..."
supabase functions deploy sentiment-analysis

echo "All functions deployed successfully!"

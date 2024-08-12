
HOW TO PULL FROM GIT AND START STAGING DOCKER:
1. SSH into the ec2 instance: "sudo ssh -i devsquare-menupk.pem ec2-user@34.194.58.4"
2. Navigate to the staging dir: "cd /var/www/staging/menupk
3. Pull your branch.
4. Restart the server: "docker-compose -f compose.staging.yaml up --build -d"
5. Optional: reload the client: "pm2 reload 0"

HOW TO PULL FROM GIT AND START PRODUCTION DOCKER:
1. SSH into the ec2 instance: "sudo ssh -i devsquare-menupk.pem ec2-user@34.194.58.4"
2. Navigate to the production dir: "cd /usr/local/menupk-prod/menupk
3. Pull the main branch.
4. Restart the server: "docker-compose -f compose.prod.yaml up --build -d"
5. Optional: reload the client: "pm2 reload 1"# De-Business-Consult
# De-Business-Consult
# De-Business-Consult

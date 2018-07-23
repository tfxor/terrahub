# Specify default values for variables defined in variables.tf

############
# provider #
############
project = "terrahub-demo"
project_id = "terrahub-demo-210811"
region = "us-central1"

#############
# top level #
#############
name = "autohealing-health-check-http"
check_interval_sec = 5
timeout_sec = 5
healthy_threshold = 2
unhealthy_threshold = 10    
request_path = "/"
port = "80"    

##########
# custom #
##########


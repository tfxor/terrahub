# Specify default values for variables defined in variables.tf

############
# provider #
############
account_id = "123456789012"
region     = "us-east-1"

#############
# top level #
#############
identity_pool_name               = "{{ name }}"
allow_unauthenticated_identities = false

##########
# custom #
##########

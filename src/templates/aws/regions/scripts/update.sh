#!/usr/bin/env bash

regions=($(aws ec2 describe-regions \
    --filters 'Name=endpoint,Values=*' \
    --query 'Regions[].RegionName' \
    --output text))

regionLastPosition=$(( ${#regions[*]} - 1 ))
regionLast=${regions[$regionLastPosition]}

echo "["

for region in "${regions[@]}"
do
  echo "{\"code\": \"${region}\", \"public\": true, \"zones\": [ "

  zones=($(aws ec2 describe-availability-zones --region ${region} --query 'AvailabilityZones[].[ZoneName]' --output text))
  lastPosition=$(( ${#zones[*]} - 1 ))
  last=${zones[$lastPosition]}

  for zone in "${zones[@]}"
  do
    if [[ ${zone} == ${last} ]]; then
      echo "\"${zone}\""
    else
      echo "\"${zone}\","
    fi
  done

  if [[ ${region} == ${regionLast} ]]; then
      echo "] }"
  else
      echo "] },"
  fi
done

echo "]"




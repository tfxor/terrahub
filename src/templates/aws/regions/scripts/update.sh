#!/usr/bin/env bash

regions=($(aws ec2 describe-regions \
    --filters 'Name=endpoint,Values=*' \
    --query 'Regions[].RegionName' \
    --output text))

regionPos=$(( ${#regions[*]} - 1 ))
regionLast=${regions[$regionPos]}



echo "["

for region in "${regions[@]}"
do
    echo "{\"code\": \"${region}\", \"public\": true, \"zones\": [ "

    zones=($(aws ec2 describe-availability-zones --region ${region} --query 'AvailabilityZones[].[ZoneName]' --output text))
    pos=$(( ${#zones[*]} - 1 ))
    last=${zones[$pos]}

    for zone in "${zones[@]}"
    do
      if [[ ${zone} == ${last} ]]
      then
        echo "\"${zone}\""
      else
        echo "\"${zone}\","
      fi
    done

    if [[ ${region} == ${regionLast} ]]
    then
        echo "] }"

    else
        echo "] },"
    fi
done

echo "]"




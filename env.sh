#!/bin/bash

# Initialize an empty string for parameter overrides
PARAM_OVERRIDES=""

# Function to add parameters for a specific function from env.json
function add_params() {
    local func_name=$1
    # Extract parameters for the function and format them for SAM CLI
    local params=$(jq -r ".${func_name} | to_entries | map(\"\(.key)=\(.value)\") | .[]" env.json | xargs)
    for param in $params; do
        PARAM_OVERRIDES="$PARAM_OVERRIDES ParameterKey=${param%%=*},ParameterValue=${param#*=}"
    done
}

# Read each function name and collect all parameters
for func in $(jq -r 'keys[]' env.json); do
    add_params $func
done

# Trim leading space
PARAM_OVERRIDES=$(echo $PARAM_OVERRIDES | xargs)

echo "Deploying with parameters: $PARAM_OVERRIDES"

# Deploy using SAM CLI with compiled parameter overrides
sam deploy --parameter-overrides $PARAM_OVERRIDES

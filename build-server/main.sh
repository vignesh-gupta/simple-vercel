#!/bin/bash

export GIT_REPOSITORY__URL="$GIT_REPOSITORY__URL"

git clone "$GIT_REPOSITORY__URL" /home/app/output

echo $GIT_REPOSITORY__URL

exec node script.js
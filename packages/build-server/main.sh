#!bin/bash

export GIT_REPOSIROTY_URL="$GIT_REPOSIROTY_URL"

git clone "$GIT_REPOSIROTY_URL" /home/app/output

exec node script.js


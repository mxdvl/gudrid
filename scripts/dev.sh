#!/usr/bin/env bash

if ! command -v deno &> /dev/null
then
    echo "Please install deno first"
    echo "https://docs.deno.com/runtime/manual/getting_started/installation"
    exit 1
fi

deno run --allow-net --allow-read https://deno.land/std@0.208.0/http/file_server.ts .
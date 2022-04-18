#!/bin/bash
cd scripts/genstardb
poetry install
poetry run python -m src.stars -o .temp
cd .temp
tar -zcf star_data.tar.gz *
cp star_data.tar.gz ../../../data
cd ../ && rm -rf .temp
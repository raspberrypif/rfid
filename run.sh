#!/bin/sh
cd /home/pi/pi-rfid
sudo python modules/reader.py > data/reader.log &
sudo node index.js > data/index.log &
cd /

#!/bin/sh
cd /home/pi/pi-rfid
sudo python modules/reader.py &
sudo node index > data/log &
cd /

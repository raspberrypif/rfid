#!/usr/bin/env python
# @wolfram77


# required modules
import time
import RPi.GPIO as GPIO
from requests_futures.sessions import FuturesSession


# config
ctimeout = 0.1


# connections
pdata0 = 14
pdata1 = 15
pgreen = 18
pred = 23
pbeep = 24
phold = 25
pcard = 8


# pin modes
GPIO.setmode(GPIO.BCM)
GPIO.setup(pdata0, GPIO.IN)
GPIO.setup(pdata1, GPIO.IN)


# initialize
session = FuturesSession()
card = 1
cbits = 0



# handle card data0 low
def cdata0_low(channel):
  global card, cbits
  card <<= 1
  cbits += 1


# handle card data1 low
def cdata1_low(channel):
  global card, cbits
  card = (card << 1) | 1
  cbits += 1


# set card data handlers
GPIO.add_event_detect(pdata0, GPIO.FALLING, callback=cdata0_low)
GPIO.add_event_detect(pdata1, GPIO.FALLING, callback=cdata1_low)


# card read code
print "[reader] ready!"
try:
  while True:
    time.sleep(ctimeout)
    if cbits > 0:
      time.sleep(ctimeout)
      print "[%d bit] - %d" % (cbits, card)
      payload = {"card": card, "cbits": cbits}
      session.post("http://localhost/api/reader/card", payload)
      card = 1
      cbits = 0
except KeyboardInterrupt:
  GPIO.cleanup()

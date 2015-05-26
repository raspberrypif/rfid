#!/usr/bin/env python
# @wolfram77


# required modules
import time
import RPi.GPIO as GPIO


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
GPIO.setup(pgreen, GPIO.OUT)
GPIO.setup(pbeep, GPIO.OUT)
# GPIO.setup(pred, GPIO.OUT)
# GPIO.setup(phold, GPIO.IN)
# GPIO.setup(pcard, GPIO.IN)
GPIO.output(pgreen, GPIO.HIGH)
GPIO.output(pbeep, GPIO.HIGH)


# initialize
card = 0
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
print "pi-snax-reader"
try:
    while True:
        time.sleep(ctimeout)
        if cbits > 0:
            time.sleep(ctimeout)
            print "[%d bit] - %d" % (cbits, card)
            card = cbits = 0
except KeyboardInterrupt:
    GPIO.cleanup()

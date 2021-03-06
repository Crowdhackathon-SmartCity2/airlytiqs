// libraries
#include <Wire.h>
#include "Adafruit_SI1145.h"
#include <NeoSWSerial.h>
#include "Adafruit_FONA.h"
// end of libraries
// ******************************************************************************************************************************************************

// pins & variables declaration
// *********** SIM 800 ****************
#define FONA_RX      3      // SIM800 RX
#define FONA_TX      4      // SIM800 TX
#define FONA_RST     5      // SIM800 RST
// ************************************
// ***********   DUST  ****************
#define measurePin   A0     // DUST analog out
#define ledPower     10     // DUST PWM
// ************************************
// ***********   MQ-7  ****************
#define CO    A3 // MQ-7 analog out
#define heater 9 // MQ-7 heater, PWM ~ 1.7V for low
// end of pins & variables definition
// ******************************************************************************************************************************************************

NeoSWSerial modem (FONA_TX, FONA_RX);            // setup NeoSWSerial for SIM800
Adafruit_FONA ada_fona = Adafruit_FONA(FONA_RST);// create modem
Adafruit_SI1145 uv = Adafruit_SI1145();          // create uv sensor

// Function declaration
bool pack_and_flush(int var, char *buffer, char *packet) { /* pack int and flush buffer */
  itoa(var, buffer, 10);
  //for (byte i=0; i<20; i++) Serial.print(buffer[i]);
  strcat(packet, buffer);
  strcat(packet, ",");
  buffer[0] = (char) 0;
  return 1;
}

bool pack_and_flush(float var, char *buffer, char *packet) { /* pack float and flush buffer */
  dtostrf(var, 10, 4, buffer);
  strcat(packet, buffer);
  //for (byte i=0; i<20; i++) Serial.print(buffer[i]);
  strcat(packet, ",");
  buffer[0] = (char) 0;
  return 1;
}

float dust_measure(int samplingTime, byte deltaTime, int sleepTime) { /* measure dust */
  static int voMeasured;
  static float calcVoltage;
  digitalWrite(ledPower, LOW);                // LED OFF
  delayMicroseconds(samplingTime);
  voMeasured = analogRead(measurePin);        // ADC value
  delayMicroseconds(deltaTime);
  digitalWrite(ledPower, HIGH);               // LED ON
  delayMicroseconds(sleepTime);
  calcVoltage = voMeasured * (5.0 / 1024);
  float dustDensity = (0.17 * calcVoltage - 0.1) * 1000; // Chris Nafis (c) 2012
  return dustDensity;
}

int CO_ppm(double rawValue){ /* Calculate CO PPM */
    double ppm = 3.027*exp(1.0698*(rawValue*3.3/4095));
    return ppm;
}

void flush_FONA() { /* flush NeoSWSerial */
  char inChar;
  while (modem.available()) {
    inChar = modem.read();
    Serial.write(inChar);
    delay(20);
  }
}

void flush_serial() { /* clear the UART */
  while (Serial.available())
    Serial.read();
}

char get_net_stat() { /* get network status from provider */
  uint8_t nn = ada_fona.getNetworkStatus();
  Serial.print(nn);
  Serial.print(F(": "));
  return nn; // 1 is home registerd, 5 is roaming registerd
}

bool http_post(uint8_t* url, uint8_t* packet) { /* HTTP POST */ // UDR0 is fukin fast
  uint16_t statuscode;
  int16_t length;
  bool postOK;
  uint8_t urlz[strlen(url) + 1] = {0};
  strcpy(urlz, url);        // Handles null termination, will test for removing

  flush_serial();
  if (!ada_fona.HTTP_POST_start(urlz, F("text/plain"), (uint8_t *) packet, strlen(packet), &statuscode, (uint16_t *)&length)) {
    Serial.println(F("Failed!"));
    postOK = 0;
  }
  else postOK = 1;

  /* consume response */
  while (length > 0 && postOK) {
    while (ada_fona.available() && postOK) {
      char c = ada_fona.read();
#if defined(__AVR_ATmega328P__) || defined(__AVR_ATmega168__)
      loop_until_bit_is_set(UCSR0A, UDRE0); /* Wait until data register empty. */
      UDR0 = c;
#else
      Serial.write(c);
#endif
      length--;
      if (! length) break;
    }
  }
  ada_fona.HTTP_POST_end();
  return postOK;
}
// end of function declaration
// ******************************************************************************************************************************************************

/***************************************************
  This is a library for the Si1145 UV/IR/Visible Light Sensor

  Designed specifically to work with the Si1145 sensor in the
  adafruit shop
  ----> https://www.adafruit.com/products/1777

  These sensors use I2C to communicate, 2 pins are required to
  interface
  Adafruit invests time and resources providing this open source code,
  please support Adafruit and open-source hardware by purchasing
  products from Adafruit!

  Written by Limor Fried/Ladyada for Adafruit Industries.
  BSD license, all text above must be included in any redistribution
 ****************************************************/


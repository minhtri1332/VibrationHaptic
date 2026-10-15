package com.vibrationhaptic.signal

import com.facebook.react.bridge.ReactApplicationContext
import com.vibrationhaptic.specs.NativeSignalServiceSpec

class SignalServiceModule(reactContext: ReactApplicationContext) :
  NativeSignalServiceSpec(reactContext) {

  override fun start(deviceId: String) {
    SignalListenerService.start(reactApplicationContext, deviceId)
  }

  override fun stop() {
    SignalListenerService.stop(reactApplicationContext)
  }
}

package com.vibrationhaptic.signal

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.vibrationhaptic.specs.NativeSignalServiceSpec

class SignalServicePackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeSignalServiceSpec.NAME) SignalServiceModule(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      NativeSignalServiceSpec.NAME to
        ReactModuleInfo(
          name = NativeSignalServiceSpec.NAME,
          className = NativeSignalServiceSpec.NAME,
          canOverrideExistingModule = false,
          needsEagerInit = false,
          isCxxModule = false,
          isTurboModule = true,
        )
    )
  }
}
